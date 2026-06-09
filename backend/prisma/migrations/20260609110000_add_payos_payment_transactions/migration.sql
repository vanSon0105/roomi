ALTER TABLE `orders`
MODIFY `paymentMethod` ENUM('COD', 'BANK_TRANSFER', 'ONLINE', 'PAYOS') NOT NULL DEFAULT 'COD';

CREATE TABLE `payment_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `provider` ENUM('PAYOS') NOT NULL DEFAULT 'PAYOS',
    `providerOrderCode` BIGINT NULL,
    `providerPaymentLinkId` VARCHAR(191) NULL,
    `checkoutUrl` VARCHAR(1000) NULL,
    `qrCode` TEXT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'PROCESSING', 'UNDERPAID') NOT NULL DEFAULT 'PENDING',
    `requestPayload` LONGTEXT NULL,
    `responsePayload` LONGTEXT NULL,
    `webhookPayload` LONGTEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_transactions_providerOrderCode_key`(`providerOrderCode`),
    UNIQUE INDEX `payment_transactions_providerPaymentLinkId_key`(`providerPaymentLinkId`),
    INDEX `payment_transactions_orderId_provider_status_idx`(`orderId`, `provider`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payment_transactions`
ADD CONSTRAINT `payment_transactions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
