-- Үнэгүй зөвлөгөө: consultation_type, слот холбоос, өвчтөн/эмчийн талбарууд
SET NAMES utf8mb4;
SET @db = DATABASE();

-- schedule_slots.consultation_type
SET @col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'schedule_slots' AND COLUMN_NAME = 'consultation_type'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE `schedule_slots` ADD COLUMN `consultation_type` ENUM(''paid_visit'',''free_consultation'') NOT NULL DEFAULT ''paid_visit'' AFTER `slot_status`',
  'SELECT ''schedule_slots.consultation_type exists'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'schedule_slots' AND INDEX_NAME = 'idx_slots_free_avail'
);
SET @sql := IF(
  @idx = 0,
  'CREATE INDEX `idx_slots_free_avail` ON `schedule_slots` (`consultation_type`, `slot_date`, `is_available`, `slot_status`)',
  'SELECT ''idx_slots_free_avail exists'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- consultation_requests extensions
SET @col := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'consultation_requests' AND COLUMN_NAME = 'slot_id'
);
SET @sql := IF(
  @col = 0,
  'ALTER TABLE `consultation_requests`
    ADD COLUMN `slot_id` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `doctor_id`,
    ADD COLUMN `consultation_type` VARCHAR(32) NOT NULL DEFAULT ''free_consultation'' AFTER `request_type`,
    ADD COLUMN `symptoms` TEXT NULL AFTER `patient_message`,
    ADD COLUMN `question` TEXT NULL AFTER `symptoms`,
    ADD COLUMN `notes` TEXT NULL AFTER `question`,
    ADD COLUMN `provider_notes` TEXT NULL AFTER `provider_message`',
  'SELECT ''consultation_requests columns exist'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'consultation_requests' AND CONSTRAINT_NAME = 'fk_consult_slot'
);
SET @sql := IF(
  @fk = 0,
  'ALTER TABLE `consultation_requests`
    ADD CONSTRAINT `fk_consult_slot` FOREIGN KEY (`slot_id`) REFERENCES `schedule_slots` (`id`)
      ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT ''fk_consult_slot exists'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
