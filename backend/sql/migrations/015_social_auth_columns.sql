-- Google / social login — users багана (idempotent)
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'auth_provider'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `auth_provider` VARCHAR(32) NOT NULL DEFAULT ''email'' AFTER `password_hash`',
  'SELECT ''users.auth_provider already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'provider_id'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `provider_id` VARCHAR(128) NULL DEFAULT NULL AFTER `auth_provider`',
  'SELECT ''users.provider_id already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar_url'
);
SET @sql := IF(
  @exists = 0,
  'ALTER TABLE `users` ADD COLUMN `avatar_url` VARCHAR(512) NULL DEFAULT NULL AFTER `provider_id`',
  'SELECT ''users.avatar_url already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Google-only хэрэглэгчид нууц үггүй
SET @nullable := (
  SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'
  LIMIT 1
);
SET @sql := IF(
  @nullable = 'NO',
  'ALTER TABLE `users` MODIFY COLUMN `password_hash` VARCHAR(255) NULL DEFAULT NULL',
  'SELECT ''users.password_hash already nullable'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_auth_provider_id'
);
SET @sql := IF(
  @idx_exists = 0,
  'CREATE INDEX `idx_users_auth_provider_id` ON `users` (`auth_provider`, `provider_id`)',
  'SELECT ''idx_users_auth_provider_id already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
