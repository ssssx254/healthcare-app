-- services.consultation_type — хуучин production суурь дээр дутуу байж болно
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'services' AND COLUMN_NAME = 'consultation_type'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE `services` ADD COLUMN `consultation_type` ENUM(''online'',''in_person'') NOT NULL DEFAULT ''in_person'' AFTER `duration_minutes`',
  'SELECT ''services.consultation_type exists'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
