-- Provider-defined service categories (visible before any service uses them)
CREATE TABLE IF NOT EXISTS `clinic_service_categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clinic_service_category_name` (`clinic_id`, `name`),
  KEY `idx_clinic_service_categories_clinic` (`clinic_id`),
  CONSTRAINT `fk_clinic_service_categories_clinic`
    FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
