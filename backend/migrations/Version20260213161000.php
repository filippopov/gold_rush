<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213161000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create metal_price_snapshot table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE metal_price_snapshot (id INT AUTO_INCREMENT NOT NULL, provider VARCHAR(32) NOT NULL, provider_function VARCHAR(64) NOT NULL, symbol VARCHAR(10) NOT NULL, metal_name VARCHAR(32) DEFAULT NULL, quote_currency VARCHAR(3) NOT NULL, price NUMERIC(20, 8) NOT NULL, nominal_raw VARCHAR(64) NOT NULL, provider_timestamp_raw VARCHAR(64) NOT NULL, provider_timestamp_utc DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', fetched_at_utc DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', UNIQUE INDEX UNIQ_METAL_PROVIDER_SYMBOL_CURR_TS (provider, symbol, quote_currency, provider_timestamp_utc), INDEX IDX_METAL_SYMBOL_PROVIDER_TS (symbol, provider_timestamp_utc), INDEX IDX_METAL_FETCHED_AT (fetched_at_utc), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE metal_price_snapshot');
    }
}
