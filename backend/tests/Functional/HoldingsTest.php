<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class HoldingsTest extends ApiWebTestCase
{
    public function testHoldingsRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/holdings');

        self::assertResponseStatusCodeSame(401);
    }

    public function testUpsertAndListHoldings(): void
    {
        $credentials = $this->uniqueUserCredentials();
        $token = $this->registerAndGetToken($credentials['email'], $credentials['password']);

        $this->requestJson('PUT', '/api/holdings/XAU', ['grams' => '10'], $token);

        self::assertResponseIsSuccessful();

        $upsertPayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($upsertPayload);
        self::assertSame('XAU', $upsertPayload['symbol'] ?? null);
        self::assertSame('10.00000000', $upsertPayload['grams'] ?? null);
        self::assertArrayHasKey('ounces', $upsertPayload);

        $this->client->request('GET', '/api/holdings', [], [], $this->authHeaders($token));

        self::assertResponseIsSuccessful();

        $listPayload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($listPayload);
        self::assertSame(1, $listPayload['count'] ?? null);
        self::assertIsArray($listPayload['items'] ?? null);
        self::assertCount(1, $listPayload['items']);
        self::assertSame('XAU', $listPayload['items'][0]['symbol'] ?? null);
    }

    public function testInconsistentGramsAndOuncesReturns400(): void
    {
        $credentials = $this->uniqueUserCredentials();
        $token = $this->registerAndGetToken($credentials['email'], $credentials['password']);

        $this->requestJson('PUT', '/api/holdings/XAU', [
            'grams' => '10',
            'ounces' => '10',
        ], $token);

        self::assertResponseStatusCodeSame(400);

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertSame('grams and ounces are inconsistent', $payload['error'] ?? null);
    }
}
