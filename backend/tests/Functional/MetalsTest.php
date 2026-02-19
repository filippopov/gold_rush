<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\Entity\MetalPriceSnapshot;
use Doctrine\ORM\EntityManagerInterface;

final class MetalsTest extends ApiWebTestCase
{
    public function testMetalsLatestIsPublicAndReturnsSeededSnapshot(): void
    {
        $this->seedSnapshot('XAU');

        $this->client->request('GET', '/api/metals/latest');

        self::assertResponseIsSuccessful();

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertIsArray($payload['items'] ?? null);

        $symbols = array_map(static fn (array $item): string => (string) ($item['symbol'] ?? ''), $payload['items']);
        self::assertContains('XAU', $symbols);
    }

    public function testMetalsHistoryRejectsInvalidSymbol(): void
    {
        $this->client->request('GET', '/api/metals/history?symbol=bad!!');

        self::assertResponseStatusCodeSame(400);

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertArrayHasKey('error', $payload);
    }

    public function testMetalsHistoryReturnsSeededSnapshot(): void
    {
        $this->seedSnapshot('XAU');

        $this->client->request('GET', '/api/metals/history?symbol=XAU&limit=10');

        self::assertResponseIsSuccessful();

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertSame('XAU', $payload['symbol'] ?? null);
        self::assertIsArray($payload['items'] ?? null);
        self::assertGreaterThanOrEqual(1, $payload['count'] ?? 0);
    }

    private function seedSnapshot(string $symbol): void
    {
        $entityManager = self::getContainer()->get(EntityManagerInterface::class);

        $nowUtc = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $providerTimestampUtc = $nowUtc->modify(sprintf('-%d seconds', random_int(0, 1000)));

        $snapshot = (new MetalPriceSnapshot())
            ->setProvider('ALPHA_VANTAGE')
            ->setProviderFunction('GOLD_SILVER_SPOT')
            ->setSymbol($symbol)
            ->setMetalName($symbol === 'XAU' ? 'Gold' : null)
            ->setQuoteCurrency('USD')
            ->setPrice('2000.00000000')
            ->setNominalRaw('1 troy ounce')
            ->setProviderTimestampRaw($providerTimestampUtc->format('Y-m-d H:i:s'))
            ->setProviderTimestampUtc($providerTimestampUtc)
            ->setFetchedAtUtc($nowUtc);

        $entityManager->persist($snapshot);
        $entityManager->flush();
        $entityManager->clear();
    }
}
