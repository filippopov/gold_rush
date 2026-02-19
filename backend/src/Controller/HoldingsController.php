<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\UserMetalHolding;
use App\Repository\UserMetalHoldingRepository;
use App\Service\MetalUnitConverter;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class HoldingsController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserMetalHoldingRepository $holdings,
        private readonly MetalUnitConverter $converter,
    ) {
    }

    #[Route('/api/holdings', name: 'api_holdings_list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json([
                'error' => 'User not authenticated',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $items = [];
        foreach ($this->holdings->findByUser($user) as $holding) {
            $grams = $holding->getAmountGrams() ?? '0';

            $items[] = [
                'symbol' => $holding->getSymbol(),
                'grams' => $grams,
                'ounces' => $this->converter->gramsToTroyOunces($grams),
                'updatedAt' => $holding->getUpdatedAt()?->format('c'),
            ];
        }

        return $this->json([
            'count' => count($items),
            'items' => $items,
        ]);
    }

    #[Route('/api/holdings/{symbol}', name: 'api_holdings_upsert', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function upsert(string $symbol, Request $request): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json([
                'error' => 'User not authenticated',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $symbol = strtoupper(trim($symbol));
        if ($symbol === '' || !preg_match('/^[A-Z0-9]{1,10}$/', $symbol)) {
            return $this->json([
                'error' => 'Invalid symbol',
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json([
                'error' => 'Invalid JSON body',
            ], Response::HTTP_BAD_REQUEST);
        }

        $hasGrams = array_key_exists('grams', $data);
        $hasOunces = array_key_exists('ounces', $data);

        if (!$hasGrams && !$hasOunces) {
            return $this->json([
                'error' => 'Provide grams or ounces',
            ], Response::HTTP_BAD_REQUEST);
        }

        $gramsInput = $hasGrams ? (string) $data['grams'] : null;
        $ouncesInput = $hasOunces ? (string) $data['ounces'] : null;

        if ($hasGrams && !is_numeric($gramsInput)) {
            return $this->json([
                'error' => 'grams must be numeric',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($hasOunces && !is_numeric($ouncesInput)) {
            return $this->json([
                'error' => 'ounces must be numeric',
            ], Response::HTTP_BAD_REQUEST);
        }

        $gramsNormalized = null;

        if ($hasGrams) {
            $gramsNormalized = number_format((float) $gramsInput, 8, '.', '');
        }

        if ($hasOunces) {
            $gramsFromOunces = $this->converter->troyOuncesToGrams((string) $ouncesInput);

            if ($gramsNormalized !== null) {
                $diff = abs(((float) $gramsNormalized) - ((float) $gramsFromOunces));
                if ($diff > 0.000001) {
                    return $this->json([
                        'error' => 'grams and ounces are inconsistent',
                    ], Response::HTTP_BAD_REQUEST);
                }
            }

            $gramsNormalized = $gramsFromOunces;
        }

        if ($gramsNormalized === null) {
            return $this->json([
                'error' => 'Unable to determine grams',
            ], Response::HTTP_BAD_REQUEST);
        }

        $holding = $this->holdings->findOneByUserAndSymbol($user, $symbol);

        if (!$holding) {
            $holding = new UserMetalHolding();
            $holding->setUser($user);
            $holding->setSymbol($symbol);
            $this->entityManager->persist($holding);
        }

        $holding->setAmountGrams($gramsNormalized);
        $this->entityManager->flush();

        return $this->json([
            'symbol' => $holding->getSymbol(),
            'grams' => $holding->getAmountGrams(),
            'ounces' => $this->converter->gramsToTroyOunces($holding->getAmountGrams() ?? '0'),
            'updatedAt' => $holding->getUpdatedAt()?->format('c'),
        ]);
    }
}
