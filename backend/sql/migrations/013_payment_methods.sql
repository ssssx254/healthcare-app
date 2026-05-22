-- Хадгалсан картын аюулгүй метадата (бүтэн дугаар/CVV хадгалахгүй)
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'payment_methods'
);
SET @sql := IF(
  @exists = 0,
  'CREATE TABLE `payment_methods` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `card_brand` ENUM(''visa'',''mastercard'') NOT NULL,
    `card_last4` CHAR(4) NOT NULL,
    `card_holder_name` VARCHAR(191) NOT NULL,
    `expiry_month` TINYINT UNSIGNED NOT NULL,
    `expiry_year` SMALLINT UNSIGNED NOT NULL,
    `is_default` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_payment_methods_user` (`user_id`),
    KEY `idx_payment_methods_default` (`user_id`, `is_default`),
    CONSTRAINT `fk_payment_methods_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT ''payment_methods already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
