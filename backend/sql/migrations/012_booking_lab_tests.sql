-- Захиалгатай холбосон шинжилгээний хуваалцалт (эмч зөвхөн эндээс харна)
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'booking_lab_tests'
);
SET @sql := IF(
  @exists = 0,
  'CREATE TABLE `booking_lab_tests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `booking_id` BIGINT UNSIGNED NOT NULL,
    `lab_test_id` BIGINT UNSIGNED NOT NULL,
    `shared_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_booking_lab_test` (`booking_id`, `lab_test_id`),
    KEY `idx_blt_booking` (`booking_id`),
    KEY `idx_blt_lab_test` (`lab_test_id`),
    CONSTRAINT `fk_blt_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_blt_lab_test` FOREIGN KEY (`lab_test_id`) REFERENCES `lab_tests` (`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT ''booking_lab_tests already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
