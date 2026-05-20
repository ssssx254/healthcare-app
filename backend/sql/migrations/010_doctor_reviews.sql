-- Эмчийн үнэлгээ — зөвхөн дууссан захиалгатай үйлчлүүлэгч
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'doctor_reviews'
);
SET @sql := IF(
  @exists = 0,
  'CREATE TABLE `doctor_reviews` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `doctor_id` BIGINT UNSIGNED NOT NULL,
    `customer_user_id` BIGINT UNSIGNED NOT NULL,
    `booking_id` BIGINT UNSIGNED NOT NULL,
    `rating` TINYINT UNSIGNED NOT NULL,
    `comment` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_doctor_reviews_booking` (`booking_id`),
    KEY `idx_doctor_reviews_doctor` (`doctor_id`),
    KEY `idx_doctor_reviews_customer` (`customer_user_id`),
    CONSTRAINT `chk_doctor_reviews_rating` CHECK (`rating` >= 1 AND `rating` <= 5),
    CONSTRAINT `fk_doctor_reviews_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_doctor_reviews_customer` FOREIGN KEY (`customer_user_id`) REFERENCES `users` (`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_doctor_reviews_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT ''doctor_reviews already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
