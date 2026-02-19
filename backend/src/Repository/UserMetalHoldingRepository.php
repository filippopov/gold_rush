<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserMetalHolding;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserMetalHolding>
 */
class UserMetalHoldingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserMetalHolding::class);
    }

    /**
     * @return list<UserMetalHolding>
     */
    public function findByUser(User $user): array
    {
        return $this->createQueryBuilder('h')
            ->andWhere('h.user = :user')
            ->setParameter('user', $user)
            ->orderBy('h.symbol', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByUserAndSymbol(User $user, string $symbol): ?UserMetalHolding
    {
        return $this->findOneBy([
            'user' => $user,
            'symbol' => $symbol,
        ]);
    }
}
