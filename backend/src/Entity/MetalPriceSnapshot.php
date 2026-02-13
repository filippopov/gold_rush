<?php

namespace App\Entity;

use App\Repository\MetalPriceSnapshotRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MetalPriceSnapshotRepository::class)]
#[ORM\Table(name: 'metal_price_snapshot')]
#[ORM\UniqueConstraint(name: 'UNIQ_METAL_PROVIDER_SYMBOL_CURR_TS', fields: ['provider', 'symbol', 'quoteCurrency', 'providerTimestampUtc'])]
#[ORM\Index(name: 'IDX_METAL_SYMBOL_PROVIDER_TS', fields: ['symbol', 'providerTimestampUtc'])]
#[ORM\Index(name: 'IDX_METAL_FETCHED_AT', fields: ['fetchedAtUtc'])]
class MetalPriceSnapshot
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 32)]
    private ?string $provider = null;

    #[ORM\Column(length: 64)]
    private ?string $providerFunction = null;

    #[ORM\Column(length: 10)]
    private ?string $symbol = null;

    #[ORM\Column(length: 32, nullable: true)]
    private ?string $metalName = null;

    #[ORM\Column(length: 3)]
    private ?string $quoteCurrency = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 20, scale: 8)]
    private ?string $price = null;

    #[ORM\Column(length: 64)]
    private ?string $nominalRaw = null;

    #[ORM\Column(length: 64)]
    private ?string $providerTimestampRaw = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $providerTimestampUtc = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $fetchedAtUtc = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setProvider(string $provider): static
    {
        $this->provider = $provider;

        return $this;
    }

    public function getProviderFunction(): ?string
    {
        return $this->providerFunction;
    }

    public function setProviderFunction(string $providerFunction): static
    {
        $this->providerFunction = $providerFunction;

        return $this;
    }

    public function getSymbol(): ?string
    {
        return $this->symbol;
    }

    public function setSymbol(string $symbol): static
    {
        $this->symbol = $symbol;

        return $this;
    }

    public function getMetalName(): ?string
    {
        return $this->metalName;
    }

    public function setMetalName(?string $metalName): static
    {
        $this->metalName = $metalName;

        return $this;
    }

    public function getQuoteCurrency(): ?string
    {
        return $this->quoteCurrency;
    }

    public function setQuoteCurrency(string $quoteCurrency): static
    {
        $this->quoteCurrency = $quoteCurrency;

        return $this;
    }

    public function getPrice(): ?string
    {
        return $this->price;
    }

    public function setPrice(string $price): static
    {
        $this->price = $price;

        return $this;
    }

    public function getNominalRaw(): ?string
    {
        return $this->nominalRaw;
    }

    public function setNominalRaw(string $nominalRaw): static
    {
        $this->nominalRaw = $nominalRaw;

        return $this;
    }

    public function getProviderTimestampRaw(): ?string
    {
        return $this->providerTimestampRaw;
    }

    public function setProviderTimestampRaw(string $providerTimestampRaw): static
    {
        $this->providerTimestampRaw = $providerTimestampRaw;

        return $this;
    }

    public function getProviderTimestampUtc(): ?\DateTimeImmutable
    {
        return $this->providerTimestampUtc;
    }

    public function setProviderTimestampUtc(\DateTimeImmutable $providerTimestampUtc): static
    {
        $this->providerTimestampUtc = $providerTimestampUtc;

        return $this;
    }

    public function getFetchedAtUtc(): ?\DateTimeImmutable
    {
        return $this->fetchedAtUtc;
    }

    public function setFetchedAtUtc(\DateTimeImmutable $fetchedAtUtc): static
    {
        $this->fetchedAtUtc = $fetchedAtUtc;

        return $this;
    }
}
