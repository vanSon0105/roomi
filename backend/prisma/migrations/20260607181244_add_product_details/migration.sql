-- AlterTable
ALTER TABLE `products` ADD COLUMN `rating` DECIMAL(2, 1) NOT NULL DEFAULT 0,
    ADD COLUMN `suitableFor` TEXT NULL;
