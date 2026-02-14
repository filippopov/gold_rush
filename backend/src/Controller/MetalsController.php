<?php

namespace App\Controller;

use App\Entity\MetalPriceSnapshot;
use App\Repository\MetalPriceSnapshotRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class MetalsController extends AbstractController
{
    public function __construct(
        private readonly MetalPriceSnapshotRepository $metalPriceSnapshotRepository,
    ) {
    }

    #[Route('/api/metals/latest', name: 'api_metals_latest', methods: ['GET'])]
    public function latest(): JsonResponse
    {
        $snapshots = $this->metalPriceSnapshotRepository->findLatestPerSymbol();

        return $this->json([
            'count' => count($snapshots),
            'items' => array_map(
                fn (MetalPriceSnapshot $snapshot): array => $this->serializeSnapshot($snapshot),
                $snapshots,
            ),
        ]);
    }

    #[Route('/api/metals/history', name: 'api_metals_history', methods: ['GET'])]
    public function history(Request $request): JsonResponse
    {
        $symbol = strtoupper(trim((string) $request->query->get('symbol', '')));
        if ($symbol === '' || preg_match('/^[A-Z0-9]{2,10}$/', $symbol) !== 1) {
            return $this->json([
                'error' => 'Invalid symbol. Use 2-10 uppercase letters or digits (e.g. XAU).',
            ], Response::HTTP_BAD_REQUEST);
        }

        $limit = (int) $request->query->get('limit', 100);
        if ($limit <= 0) {
            $limit = 100;
        }
        if ($limit > 500) {
            $limit = 500;
        }

        $snapshots = $this->metalPriceSnapshotRepository->findHistoryBySymbol($symbol, $limit);

        return $this->json([
            'symbol' => $symbol,
            'count' => count($snapshots),
            'items' => array_map(
                fn (MetalPriceSnapshot $snapshot): array => $this->serializeSnapshot($snapshot),
                $snapshots,
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSnapshot(MetalPriceSnapshot $snapshot): array
    {
        return [
            'id' => $snapshot->getId(),
            'provider' => $snapshot->getProvider(),
            'providerFunction' => $snapshot->getProviderFunction(),
            'symbol' => $snapshot->getSymbol(),
            'metalName' => $snapshot->getMetalName(),
            'quoteCurrency' => $snapshot->getQuoteCurrency(),
            'price' => $snapshot->getPrice(),
            'nominalRaw' => $snapshot->getNominalRaw(),
            'providerTimestampRaw' => $snapshot->getProviderTimestampRaw(),
            'providerTimestampUtc' => $snapshot->getProviderTimestampUtc()?->format('c'),
            'fetchedAtUtc' => $snapshot->getFetchedAtUtc()?->format('c'),
        ];
    }
}
