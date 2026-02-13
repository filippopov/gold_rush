<?php

namespace App\Repository;

use App\Entity\MetalPriceSnapshot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MetalPriceSnapshot>
 */
class MetalPriceSnapshotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MetalPriceSnapshot::class);
    }

    /**
     * @return list<MetalPriceSnapshot>
     */
    public function findLatestPerSymbol(): array
    {
        $snapshots = $this->createQueryBuilder('snapshot')
            ->orderBy('snapshot.symbol', 'ASC')
            ->addOrderBy('snapshot.providerTimestampUtc', 'DESC')
            ->getQuery()
            ->getResult();

        $latestBySymbol = [];

        foreach ($snapshots as $snapshot) {
            $symbol = $snapshot->getSymbol();

            if ($symbol === null || isset($latestBySymbol[$symbol])) {
                continue;
            }

            $latestBySymbol[$symbol] = $snapshot;
        }

        return array_values($latestBySymbol);
    }

    /**
     * @return list<MetalPriceSnapshot>
     */
    public function findHistoryBySymbol(string $symbol, int $limit = 100): array
    {
        return $this->createQueryBuilder('snapshot')
            ->andWhere('snapshot.symbol = :symbol')
            ->setParameter('symbol', strtoupper($symbol))
            ->orderBy('snapshot.providerTimestampUtc', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
