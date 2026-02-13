<?php

namespace App\Command;

use JsonException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:metals:current-prices',
    description: 'Fetch current precious metals prices from Alpha Vantage.',
)]
class FetchPreciousMetalsPricesCommand extends Command
{
    private const DEFAULT_SYMBOLS = ['XAU', 'XAG'];
    private const MAX_ATTEMPTS_PER_SYMBOL = 3;

    private const METAL_NAMES = [
        'XAU' => 'Gold',
        'XAG' => 'Silver',
        'XPT' => 'Platinum',
        'XPD' => 'Palladium',
    ];

    protected function configure(): void
    {
        $this
            ->addOption(
                'symbols',
                null,
                InputOption::VALUE_REQUIRED,
                'Comma-separated symbols to fetch',
                implode(',', self::DEFAULT_SYMBOLS),
            )
            ->addOption(
                'currency',
                null,
                InputOption::VALUE_REQUIRED,
                'Quote currency (3-letter code)',
                'USD',
            )
            ->addOption(
                'api-key',
                null,
                InputOption::VALUE_REQUIRED,
                'Alpha Vantage API key override',
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $apiKey = trim((string) ($input->getOption('api-key') ?? ''));
        if ($apiKey === '') {
            $apiKey = trim((string) ($_ENV['ALPHA_VANTAGE_API_KEY'] ?? $_SERVER['ALPHA_VANTAGE_API_KEY'] ?? ''));
        }

        if ($apiKey === '') {
            $io->error('Missing Alpha Vantage API key. Provide --api-key or set ALPHA_VANTAGE_API_KEY.');

            return Command::FAILURE;
        }

        $currency = strtoupper(trim((string) $input->getOption('currency')));
        if (!preg_match('/^[A-Z]{3}$/', $currency)) {
            $io->error('Invalid currency format. Use a 3-letter code such as USD.');

            return Command::FAILURE;
        }

        if ($currency !== 'USD') {
            $io->warning('Alpha Vantage GOLD_SILVER_SPOT returns USD spot prices. Ignoring --currency and using USD.');
        }

        $symbolsInput = (string) $input->getOption('symbols');
        $symbols = array_values(array_unique(array_filter(array_map(
            static fn (string $symbol): string => strtoupper(trim($symbol)),
            explode(',', $symbolsInput),
        ))));

        if ($symbols === []) {
            $io->error('No symbols provided. Example: --symbols=XAU,XAG');

            return Command::FAILURE;
        }

        $rows = [];
        $successCount = 0;
        $failedCount = 0;

        foreach ($symbols as $symbol) {
            if (!preg_match('/^[A-Z0-9]{2,10}$/', $symbol)) {
                ++$failedCount;
                $io->warning(sprintf('Skipping symbol "%s": invalid format.', $symbol));

                continue;
            }

            $url = sprintf(
                'https://www.alphavantage.co/query?function=GOLD_SILVER_SPOT&symbol=%s&apikey=%s',
                rawurlencode($symbol),
                rawurlencode($apiKey),
            );

            $payload = null;
            $lastError = null;

            for ($attempt = 1; $attempt <= self::MAX_ATTEMPTS_PER_SYMBOL; ++$attempt) {
                try {
                    $payload = $this->fetchJson($url);
                } catch (\RuntimeException $exception) {
                    $lastError = $exception->getMessage();
                    sleep(1);

                    continue;
                }

                $apiError = (string) ($payload['Error Message'] ?? $payload['Note'] ?? $payload['Information'] ?? '');
                if ($apiError !== '' && str_contains(strtolower($apiError), 'spreading out your free api requests')) {
                    $lastError = sprintf('Alpha Vantage rate limit: %s', $apiError);
                    sleep(1);

                    continue;
                }

                $lastError = null;

                break;
            }

            if (!is_array($payload)) {
                ++$failedCount;
                $io->warning(sprintf('%s: %s', $symbol, $lastError ?? 'Unknown error while fetching data.'));

                continue;
            }

            if (isset($payload['Note']) || isset($payload['Information']) || isset($payload['Error Message'])) {
                ++$failedCount;
                $message = (string) ($payload['Error Message'] ?? $payload['Note'] ?? $payload['Information']);
                $io->warning(sprintf('%s: Alpha Vantage error: %s', $symbol, $message));

                continue;
            }

            $spotPrice = $payload['price'] ?? null;
            $spotTimestamp = $payload['timestamp'] ?? null;
            $nominal = $payload['nominal'] ?? null;

            if (!is_scalar($spotPrice) || !is_scalar($spotTimestamp) || !is_scalar($nominal)) {
                ++$failedCount;
                $io->warning(sprintf('%s: Missing required fields in GOLD_SILVER_SPOT payload.', $symbol));

                continue;
            }

            $spotPriceValue = trim((string) $spotPrice);
            $nominalValue = trim((string) $nominal);
            $timestampValue = trim((string) $spotTimestamp);

            if ($spotPriceValue === '' || !is_numeric($spotPriceValue) || strcasecmp($nominalValue, 'invalid') === 0 || $timestampValue === '') {
                ++$failedCount;
                $io->warning(sprintf('%s: Unsupported or invalid spot response from Alpha Vantage.', $symbol));

                continue;
            }

            $rows[] = [
                self::METAL_NAMES[$symbol] ?? $symbol,
                $symbol,
                $spotPriceValue,
                $nominalValue,
                $timestampValue,
            ];
            ++$successCount;

            sleep(1);
        }

        if ($rows !== []) {
            $io->table(
                ['Metal', 'Symbol', 'Price', 'Nominal', 'Timestamp'],
                $rows,
            );
        }

        if ($successCount > 0) {
            if ($failedCount > 0) {
                $io->warning(sprintf('Completed with partial success: %d succeeded, %d failed.', $successCount, $failedCount));
            } else {
                $io->success(sprintf('Completed successfully: %d symbol(s) fetched.', $successCount));
            }

            return Command::SUCCESS;
        }

        $io->error('Failed to fetch prices for all requested symbols.');

        return Command::FAILURE;
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchJson(string $url): array
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 15,
                'ignore_errors' => true,
                'header' => "Accept: application/json\r\nUser-Agent: gold-rush-cli/1.0\r\n",
            ],
        ]);

        $body = @file_get_contents($url, false, $context);
        if ($body === false) {
            throw new \RuntimeException('Network failure while calling Alpha Vantage.');
        }

        $statusCode = $this->extractStatusCode($http_response_header ?? []);
        if ($statusCode !== 200) {
            throw new \RuntimeException(sprintf('Non-200 response from Alpha Vantage: HTTP %d.', $statusCode));
        }

        try {
            $decoded = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new \RuntimeException('Malformed JSON response from Alpha Vantage.');
        }

        if (!is_array($decoded)) {
            throw new \RuntimeException('Unexpected response format from Alpha Vantage.');
        }

        return $decoded;
    }

    /**
     * @param array<int, string> $headers
     */
    private function extractStatusCode(array $headers): int
    {
        foreach ($headers as $headerLine) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', $headerLine, $matches) === 1) {
                return (int) $matches[1];
            }
        }

        return 0;
    }
}
