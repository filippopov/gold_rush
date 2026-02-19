<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class AuthTest extends ApiWebTestCase
{
    public function testMeRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/me');

        self::assertResponseStatusCodeSame(401);
    }

    public function testRegisterThenMeWorks(): void
    {
        $credentials = $this->uniqueUserCredentials();
        $token = $this->registerAndGetToken($credentials['email'], $credentials['password']);

        $this->client->request('GET', '/api/me', [], [], $this->authHeaders($token));

        self::assertResponseIsSuccessful();

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertSame($credentials['email'], $payload['email'] ?? null);
    }
}
