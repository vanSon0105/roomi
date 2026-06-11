-- AlterTable
ALTER TABLE `orders`
  ADD COLUMN `orderType` ENUM('PRODUCT', 'ROOM3D_ACCESS') NOT NULL DEFAULT 'PRODUCT';

-- CreateIndex
CREATE INDEX `orders_orderType_idx` ON `orders`(`orderType`);

-- CreateTable
CREATE TABLE `room3d_accesses` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `orderId` INTEGER NULL,
  `pricePaid` DECIMAL(12, 2) NOT NULL DEFAULT 0,
  `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NULL,

  UNIQUE INDEX `room3d_accesses_userId_key`(`userId`),
  UNIQUE INDEX `room3d_accesses_orderId_key`(`orderId`),
  INDEX `room3d_accesses_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `room3d_accesses`
  ADD CONSTRAINT `room3d_accesses_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room3d_accesses`
  ADD CONSTRAINT `room3d_accesses_orderId_fkey`
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default 3D price.
INSERT INTO `settings` (`key`, `value`)
VALUES ('room3d_price', '0')
ON DUPLICATE KEY UPDATE `value` = `value`;
