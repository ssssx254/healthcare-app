-- Эмчийн жагсаалт / дэлгэрэнгүй API `education`, `work_history`, `experience_years`, `profile_image` багана шаарддаг.
-- Хуучин суурь дээр нэмэх (нэг удаа ажиллуулна).
-- Windows: `npm run db:migrate -- sql/migrations/004_doctors_list_columns.sql` (backend хавтас, .env ашиглана)

SET NAMES utf8mb4;
SET @db = DATABASE();

-- education
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'education'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `doctors` ADD COLUMN `education` TEXT NULL',
  'SELECT ''doctors.education already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- work_history
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'work_history'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `doctors` ADD COLUMN `work_history` TEXT NULL',
  'SELECT ''doctors.work_history already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- experience_years
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'experience_years'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `doctors` ADD COLUMN `experience_years` SMALLINT UNSIGNED NULL DEFAULT NULL',
  'SELECT ''doctors.experience_years already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- profile_image
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'profile_image'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `doctors` ADD COLUMN `profile_image` VARCHAR(512) NULL DEFAULT NULL',
  'SELECT ''doctors.profile_image already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
