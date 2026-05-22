-- Үнэгүй зөвлөгөөний availability query `services.is_free_consultation` ашиглана
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'services' AND COLUMN_NAME = 'is_free_consultation'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE `services` ADD COLUMN `is_free_consultation` TINYINT(1) NOT NULL DEFAULT 0 AFTER `price`',
  'SELECT ''services.is_free_consultation exists'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'services' AND INDEX_NAME = 'idx_services_free'
);
SET @sql := IF(
  @idx = 0,
  'CREATE INDEX `idx_services_free` ON `services` (`is_free_consultation`)',
  'SELECT ''idx_services_free exists'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
