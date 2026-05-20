-- Шинжилгээ — үйлчлүүлэгч нэмэх, эмнэлэг хариу өгөх
SET NAMES utf8mb4;
SET @db = DATABASE();

SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'lab_tests'
);
SET @sql := IF(
  @exists = 0,
  'CREATE TABLE `lab_tests` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `patient_user_id` BIGINT UNSIGNED NOT NULL,
    `clinic_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `doctor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `booking_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `test_type` VARCHAR(128) NOT NULL,
    `test_date` DATE NOT NULL,
    `description` TEXT NULL,
    `attachment_url` MEDIUMTEXT NULL,
    `attachment_type` VARCHAR(32) NULL DEFAULT NULL,
    `result_text` TEXT NULL,
    `result_file_url` MEDIUMTEXT NULL,
    `result_file_type` VARCHAR(32) NULL DEFAULT NULL,
    `doctor_notes` TEXT NULL,
    `status` ENUM(''submitted'',''completed'',''reviewed'') NOT NULL DEFAULT ''submitted'',
    `uploaded_by` ENUM(''customer'',''clinic'') NOT NULL DEFAULT ''customer'',
    `created_by_user_id` BIGINT UNSIGNED NOT NULL,
    `reviewed_by_user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_lab_tests_patient` (`patient_user_id`),
    KEY `idx_lab_tests_clinic` (`clinic_id`),
    KEY `idx_lab_tests_status` (`status`),
    KEY `idx_lab_tests_uploaded_by` (`uploaded_by`),
    CONSTRAINT `fk_lab_tests_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_lab_tests_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_lab_tests_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_lab_tests_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
      ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_lab_tests_created_by` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
      ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_lab_tests_reviewed_by` FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `users` (`id`)
      ON DELETE SET NULL ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT ''lab_tests already present'' AS notice'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
