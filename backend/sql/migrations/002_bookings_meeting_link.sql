-- Existing суурь дээр нэмэх: bookings хүснэгтэд уулзалтын холбоос (idempotent)
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'meeting_link'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `bookings` ADD COLUMN `meeting_link` VARCHAR(1024) NULL DEFAULT NULL AFTER `total_amount`',
  'SELECT ''bookings.meeting_link already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
