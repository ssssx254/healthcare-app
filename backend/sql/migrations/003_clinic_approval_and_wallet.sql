-- Align existing DB with current API (run once against your app database).
-- Windows (CLI байхгүй бол): backend хавтаснаас `npm run db:migrate -- sql/migrations/003_clinic_approval_and_wallet.sql`
-- Bash: mysql -u USER -p DB_NAME < sql/migrations/003_clinic_approval_and_wallet.sql
--
-- Fixes:
--   - clinics.approval_status (public clinic/doctor queries)
--   - wallets + wallet_transactions (customer wallet / QPay mock)

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- clinics.approval_status
-- ---------------------------------------------------------------------------
SET @db = DATABASE();
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'approval_status'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `clinics` ADD COLUMN `approval_status` ENUM(''pending'', ''approved'', ''rejected'') NOT NULL DEFAULT ''pending'' AFTER `email`',
  'SELECT ''clinics.approval_status already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallets` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `balance` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'MNT',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- wallet_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `direction` ENUM('credit', 'debit') NOT NULL,
  `amount` DECIMAL(14, 2) NOT NULL,
  `balance_after` DECIMAL(14, 2) NOT NULL,
  `transaction_type` ENUM('top_up', 'booking_payment', 'booking_refund', 'admin_adjustment') NOT NULL,
  `reference_type` VARCHAR(32) NULL DEFAULT NULL,
  `reference_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `gateway_ref` VARCHAR(128) NULL DEFAULT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wallet_tx_user_created` (`user_id`, `created_at`),
  KEY `idx_wallet_tx_type` (`transaction_type`),
  KEY `idx_wallet_tx_reference` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_wallet_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
