<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260213161500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Align metal_price_snapshot datetime columns with current Doctrine mapping';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE metal_price_snapshot CHANGE provider_timestamp_utc provider_timestamp_utc DATETIME NOT NULL, CHANGE fetched_at_utc fetched_at_utc DATETIME NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE metal_price_snapshot CHANGE provider_timestamp_utc provider_timestamp_utc DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', CHANGE fetched_at_utc fetched_at_utc DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)'");
    }
}
