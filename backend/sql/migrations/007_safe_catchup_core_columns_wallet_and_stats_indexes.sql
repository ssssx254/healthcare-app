-- Safe catch-up migration (idempotent, non-destructive)
-- Зорилго:
--   1) missing core columns-уудыг аюулгүй нэмэх
--   2) wallet хүснэгтүүдийг байхгүй бол үүсгэх
--   3) stats endpoint-уудад хэрэгтэй индексүүдийг нэмэх
--   4) FK багана руу заасан CHECK constraint (хуучин MySQL/MariaDB нийцгүй) байхгүй эсэхийг баталгаажуулах
--
-- Анхаар: Энэ migration нь TABLE DROP хийхгүй. Existing DB-г устгахгүй.

SET NAMES utf8mb4;
SET @db = DATABASE();

-- ---------------------------------------------------------------------------
-- users.expo_push_token
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'expo_push_token'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `expo_push_token` VARCHAR(255) NULL DEFAULT NULL AFTER `phone`',
  'SELECT ''users.expo_push_token already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- users.onboarding_status
-- ---------------------------------------------------------------------------
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'onboarding_status'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `onboarding_status` ENUM(''pending'', ''approved'', ''rejected'') NOT NULL DEFAULT ''approved'' AFTER `role`',
  'SELECT ''users.onboarding_status already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- clinics.approval_status
-- ---------------------------------------------------------------------------
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
-- wallet tables if missing
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

-- ---------------------------------------------------------------------------
-- MySQL incompatible CHECK constraints that reference FK-like columns
-- (schema.sql дээр ийм constraint байх ёсгүй; энд runtime safeguard л хийнэ)
-- ---------------------------------------------------------------------------
SELECT COUNT(*) AS fk_like_check_constraints
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
  ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
 AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE cc.CONSTRAINT_SCHEMA = @db
  AND tc.CONSTRAINT_TYPE = 'CHECK'
  AND (
    cc.CHECK_CLAUSE LIKE '%_id %'
    OR cc.CHECK_CLAUSE LIKE '%_id)%'
    OR cc.CHECK_CLAUSE LIKE '%(_id%'
  );

-- ---------------------------------------------------------------------------
-- stats-supporting indexes (idempotent)
-- ---------------------------------------------------------------------------

-- users(role, onboarding_status)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_role_onboarding'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_users_role_onboarding` ON `users` (`role`, `onboarding_status`)',
  'SELECT ''idx_users_role_onboarding already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- users(expo_push_token)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_expo_push_token'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_users_expo_push_token` ON `users` (`expo_push_token`)',
  'SELECT ''idx_users_expo_push_token already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- clinics(approval_status)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND INDEX_NAME = 'idx_clinics_approval_status'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_clinics_approval_status` ON `clinics` (`approval_status`)',
  'SELECT ''idx_clinics_approval_status already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- clinics(owner_user_id, approval_status)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND INDEX_NAME = 'idx_clinics_owner_approval'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_clinics_owner_approval` ON `clinics` (`owner_user_id`, `approval_status`)',
  'SELECT ''idx_clinics_owner_approval already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bookings(patient_user_id, status)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'bookings' AND INDEX_NAME = 'idx_bookings_patient_status'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_bookings_patient_status` ON `bookings` (`patient_user_id`, `status`)',
  'SELECT ''idx_bookings_patient_status already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bookings(patient_user_id, payment_status)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'bookings' AND INDEX_NAME = 'idx_bookings_patient_payment'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_bookings_patient_payment` ON `bookings` (`patient_user_id`, `payment_status`)',
  'SELECT ''idx_bookings_patient_payment already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bookings(clinic_id, status, payment_status)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'bookings' AND INDEX_NAME = 'idx_bookings_clinic_status_payment'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_bookings_clinic_status_payment` ON `bookings` (`clinic_id`, `status`, `payment_status`)',
  'SELECT ''idx_bookings_clinic_status_payment already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bookings(clinic_id, created_at)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'bookings' AND INDEX_NAME = 'idx_bookings_clinic_created'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_bookings_clinic_created` ON `bookings` (`clinic_id`, `created_at`)',
  'SELECT ''idx_bookings_clinic_created already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- services(doctor_id, is_active)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'services' AND INDEX_NAME = 'idx_services_doctor_active'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_services_doctor_active` ON `services` (`doctor_id`, `is_active`)',
  'SELECT ''idx_services_doctor_active already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

