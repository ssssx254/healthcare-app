-- Эмчийн жагсаалтын SELECT: `title`, `bio` багана (004-д ороогүй).
-- `npm run db:migrate -- sql/migrations/006_doctors_title_bio.sql`

SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'title'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `doctors` ADD COLUMN `title` VARCHAR(191) NULL DEFAULT NULL AFTER `specialization`',
  'SELECT ''doctors.title already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctors' AND COLUMN_NAME = 'bio'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `doctors` ADD COLUMN `bio` TEXT NULL AFTER `title`',
  'SELECT ''doctors.bio already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
