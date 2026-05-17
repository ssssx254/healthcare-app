-- Хуучин `clinics` хүснэгтэд API-ийн SELECT-д шаардлагатай баганууд.
-- `npm run db:migrate -- sql/migrations/005_clinics_city_type_email.sql`

SET NAMES utf8mb4;
SET @db = DATABASE();

-- city
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'city'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `clinics` ADD COLUMN `city` VARCHAR(128) NULL DEFAULT NULL AFTER `address`',
  'SELECT ''clinics.city already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- clinic_type
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'clinic_type'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `clinics` ADD COLUMN `clinic_type` VARCHAR(128) NULL DEFAULT NULL AFTER `city`',
  'SELECT ''clinics.clinic_type already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- email (public жагсаалт / нэг мөр уншилтад оролцоно)
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'email'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `clinics` ADD COLUMN `email` VARCHAR(191) NULL DEFAULT NULL AFTER `phone`',
  'SELECT ''clinics.email already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
