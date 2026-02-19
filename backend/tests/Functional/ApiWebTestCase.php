<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

abstract class ApiWebTestCase extends WebTestCase
{
    private static bool $schemaInitialized = false;

    protected KernelBrowser $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient();
        $this->ensureSchema();
    }

    protected function ensureSchema(): void
    {
        if (self::$schemaInitialized) {
            return;
        }

        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $metadata = $entityManager->getMetadataFactory()->getAllMetadata();

        $schemaTool = new SchemaTool($entityManager);

        if ($metadata !== []) {
            try {
                $schemaTool->dropSchema($metadata);
            } catch (\Throwable) {
                // Ignore drop errors on a fresh database.
            }

            $schemaTool->createSchema($metadata);
        }

        $entityManager->clear();

        self::$schemaInitialized = true;
    }

    /**
     * @return array{email: string, password: string}
     */
    protected function uniqueUserCredentials(): array
    {
        $nonce = bin2hex(random_bytes(6));

        return [
            'email' => sprintf('test-%s@example.com', $nonce),
            'password' => 'Password123!',
        ];
    }

    protected function registerAndGetToken(string $email, string $password): string
    {
        $this->requestJson('POST', '/api/register', [
            'email' => $email,
            'password' => $password,
        ]);

        self::assertResponseStatusCodeSame(201);

        $payload = json_decode((string) $this->client->getResponse()->getContent(), true);
        self::assertIsArray($payload);
        self::assertArrayHasKey('token', $payload);
        self::assertIsString($payload['token']);
        self::assertNotSame('', $payload['token']);

        return $payload['token'];
    }

    protected function authHeaders(string $token): array
    {
        return [
            'HTTP_AUTHORIZATION' => sprintf('Bearer %s', $token),
            'HTTP_ACCEPT' => 'application/json',
            'CONTENT_TYPE' => 'application/json',
        ];
    }

    /**
     * @param array<string, mixed> $payload
     */
    protected function requestJson(string $method, string $uri, array $payload = [], ?string $token = null): void
    {
        $server = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
        ];

        if ($token !== null && $token !== '') {
            $server['HTTP_AUTHORIZATION'] = sprintf('Bearer %s', $token);
        }

        $this->client->request(
            $method,
            $uri,
            [],
            [],
            $server,
            json_encode($payload, JSON_THROW_ON_ERROR),
        );
    }
}
