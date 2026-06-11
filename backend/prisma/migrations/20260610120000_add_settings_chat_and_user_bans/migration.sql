-- Align migration history with the current Prisma schema before Room 3D settings are seeded.

ALTER TABLE `users`
ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `orders`
MODIFY `paymentStatus` ENUM('UNPAID', 'PAID', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'UNPAID';

CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `chat_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `guestId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Khách',
    `message` TEXT NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_messages_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `chat_messages_guestId_createdAt_idx`(`guestId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `chat_messages`
ADD CONSTRAINT `chat_messages_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
