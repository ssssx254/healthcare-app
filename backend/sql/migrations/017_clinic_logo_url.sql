-- Эмнэлгийн лого — provider засах, үйлчлүүлэгчийн жагсаалтад харагдана.
-- `npm run db:migrate:catchup` эсвэл энэ файлыг ганцаар ажиллуулна.

SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'logo_url'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `clinics` ADD COLUMN `logo_url` MEDIUMTEXT NULL DEFAULT NULL COMMENT ''HTTPS URL эсвэл data:image/...'' AFTER `email`',
  'SELECT ''clinics.logo_url already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
