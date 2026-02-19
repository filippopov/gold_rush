<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260219120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create user_metal_holding table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE user_metal_holding (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, symbol VARCHAR(10) NOT NULL, amount_grams NUMERIC(20, 8) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', UNIQUE INDEX UNIQ_HOLDING_USER_SYMBOL (user_id, symbol), INDEX IDX_HOLDING_USER (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql('ALTER TABLE user_metal_holding ADD CONSTRAINT FK_HOLDING_USER FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE user_metal_holding DROP FOREIGN KEY FK_HOLDING_USER');
        $this->addSql('DROP TABLE user_metal_holding');
    }
}
