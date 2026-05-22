-- Healthcare app — MySQL schema (InnoDB, utf8mb4)
-- Run: mysql -u USER -p DATABASE < sql/schema.sql
--
-- Шаардлага: MySQL 5.7.8+ (JSON). FK багана оролцсон CHECK-үүдийг MySQL 8.0.16+ / MariaDB нийцлэлд хассан; reviews-д зөвхөн rating range CHECK үлдэнэ.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `doctor_reviews`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_participant_reads`;
DROP TABLE IF EXISTS `chat_conversations`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `questionnaires`;
DROP TABLE IF EXISTS `consultation_requests`;
DROP TABLE IF EXISTS `booking_lab_tests`;
DROP TABLE IF EXISTS `lab_tests`;
DROP TABLE IF EXISTS `lab_test_results`;
DROP TABLE IF EXISTS `prescriptions`;
DROP TABLE IF EXISTS `medical_notes`;
DROP TABLE IF EXISTS `wallet_transactions`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `schedule_slots`;
DROP TABLE IF EXISTS `doctor_weekly_schedules`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `doctors`;
DROP TABLE IF EXISTS `platform_featured_items`;
DROP TABLE IF EXISTS `clinics`;
DROP TABLE IF EXISTS `provider_onboarding_submissions`;
DROP TABLE IF EXISTS `payment_methods`;
DROP TABLE IF EXISTS `user_payment_methods`;
DROP TABLE IF EXISTS `wallets`;
DROP TABLE IF EXISTS `content_reports`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'provider', 'system_admin') NOT NULL DEFAULT 'customer',
  `onboarding_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  `phone` VARCHAR(32) NULL DEFAULT NULL,
  `expo_push_token` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_role_onboarding` (`role`, `onboarding_status`),
  KEY `idx_users_expo_push_token` (`expo_push_token`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- content_reports (мэдээллийн зөрчилтэй контент — иргэн мэдэгдэх, админ шийдвэрлэнэ)
-- ---------------------------------------------------------------------------
CREATE TABLE `content_reports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reporter_user_id` BIGINT UNSIGNED NOT NULL,
  `target_type` ENUM(
    'chat_message',
    'review',
    'consultation_request',
    'doctor_profile',
    'clinic_profile',
    'other'
  ) NOT NULL DEFAULT 'other',
  `target_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `reason_code` VARCHAR(64) NOT NULL,
  `details` TEXT NULL,
  `status` ENUM('open', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  `admin_notes` TEXT NULL,
  `reviewed_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_content_reports_status` (`status`, `created_at`),
  KEY `idx_content_reports_target` (`target_type`, `target_id`),
  CONSTRAINT `fk_content_reports_reporter` FOREIGN KEY (`reporter_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_content_reports_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- wallets (зөвхөн үйлчлүүлэгчийн цахим данс — дотоод үлдэгдэл)
-- ---------------------------------------------------------------------------
CREATE TABLE `wallets` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `balance` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'MNT',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- user_payment_methods (гадна төлбөрийн хэрэгсэл — mock бүтэц)
-- ---------------------------------------------------------------------------
CREATE TABLE `user_payment_methods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `provider_code` VARCHAR(32) NOT NULL COMMENT 'most_money, qpay, bank_card, external_wallet',
  `label` VARCHAR(191) NOT NULL,
  `masked_detail` VARCHAR(191) NULL DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pay_methods_user` (`user_id`),
  CONSTRAINT `fk_pay_methods_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- payment_methods (хадгалсан карт — зөвхөн аюулгүй метадата)
-- ---------------------------------------------------------------------------
CREATE TABLE `payment_methods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `card_brand` ENUM('visa','mastercard') NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- provider_onboarding_submissions
-- ---------------------------------------------------------------------------
CREATE TABLE `provider_onboarding_submissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `manager_name` VARCHAR(191) NOT NULL,
  `account_email` VARCHAR(191) NOT NULL,
  `account_phone` VARCHAR(32) NOT NULL,
  `clinic_name` VARCHAR(191) NOT NULL,
  `clinic_type` VARCHAR(128) NOT NULL,
  `introduction` TEXT NOT NULL,
  `logo_url` MEDIUMTEXT NULL DEFAULT NULL COMMENT 'HTTPS URL эсвэл data:image/...;base64,...',
  `address` VARCHAR(500) NOT NULL,
  `city` VARCHAR(128) NOT NULL,
  `district` VARCHAR(128) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `contact_email` VARCHAR(191) NOT NULL,
  `working_hours` VARCHAR(191) NOT NULL,
  `online_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `ambulatory_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `supported_specialties` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_feedback` TEXT NULL,
  `reviewed_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_onboarding_user` (`user_id`),
  KEY `idx_provider_onboarding_status` (`status`),
  KEY `idx_provider_onboarding_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_provider_onboarding_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_provider_onboarding_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- clinics
-- ---------------------------------------------------------------------------
CREATE TABLE `clinics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `address` VARCHAR(500) NOT NULL,
  `city` VARCHAR(128) NULL DEFAULT NULL,
  `clinic_type` VARCHAR(128) NULL DEFAULT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `email` VARCHAR(191) NULL DEFAULT NULL,
  `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clinics_owner` (`owner_user_id`),
  KEY `idx_clinics_name` (`clinic_name`),
  KEY `idx_clinics_city` (`city`),
  KEY `idx_clinics_type` (`clinic_type`),
  KEY `idx_clinics_approval_status` (`approval_status`),
  KEY `idx_clinics_owner_approval` (`owner_user_id`, `approval_status`),
  CONSTRAINT `fk_clinics_owner_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- platform_featured_items (нүүр/захиалгын санал болгох — админ удирдана)
-- ---------------------------------------------------------------------------
CREATE TABLE `platform_featured_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_type` ENUM('clinic', 'article') NOT NULL,
  `clinic_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `article_title` VARCHAR(191) NULL DEFAULT NULL,
  `article_excerpt` TEXT NULL,
  `article_url` VARCHAR(512) NULL DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_featured_active_sort` (`is_active`, `sort_order`),
  CONSTRAINT `fk_featured_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
CREATE TABLE `doctors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `specialization` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL DEFAULT NULL,
  `bio` TEXT NULL,
  `education` TEXT NULL,
  `work_history` TEXT NULL,
  `experience_years` SMALLINT UNSIGNED NULL DEFAULT NULL,
  `profile_image` VARCHAR(512) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doctors_clinic` (`clinic_id`),
  KEY `idx_doctors_specialization` (`specialization`),
  CONSTRAINT `fk_doctors_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE TABLE `services` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `doctor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `service_name` VARCHAR(191) NOT NULL,
  `category` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `is_free_consultation` TINYINT(1) NOT NULL DEFAULT 0,
  `duration_minutes` SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  `consultation_type` ENUM('online', 'in_person') NOT NULL DEFAULT 'in_person',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_services_clinic` (`clinic_id`),
  KEY `idx_services_doctor` (`doctor_id`),
  KEY `idx_services_doctor_active` (`doctor_id`, `is_active`),
  KEY `idx_services_category` (`category`),
  KEY `idx_services_free` (`is_free_consultation`),
  CONSTRAINT `fk_services_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_services_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- doctor_weekly_schedules
-- ---------------------------------------------------------------------------
CREATE TABLE `doctor_weekly_schedules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `weekday` TINYINT UNSIGNED NOT NULL COMMENT '0=Sun .. 6=Sat',
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_weekday` (`doctor_id`, `weekday`),
  KEY `idx_weekly_schedule_doctor` (`doctor_id`),
  CONSTRAINT `fk_weekly_schedule_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- schedule_slots
-- ---------------------------------------------------------------------------
CREATE TABLE `schedule_slots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `service_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `slot_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `slot_status` ENUM('available', 'booked', 'blocked', 'unavailable') NOT NULL DEFAULT 'available',
  `consultation_type` ENUM('paid_visit','free_consultation') NOT NULL DEFAULT 'paid_visit',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slots_doctor_start` (`doctor_id`, `slot_date`, `start_time`),
  KEY `idx_slots_doctor_date` (`doctor_id`, `slot_date`),
  KEY `idx_slots_available` (`is_available`, `slot_date`),
  KEY `idx_slots_service` (`service_id`),
  CONSTRAINT `fk_slots_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_slots_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `service_id` BIGINT UNSIGNED NOT NULL,
  `slot_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `booking_type` VARCHAR(32) NOT NULL DEFAULT 'formal',
  `status` VARCHAR(48) NOT NULL DEFAULT 'pending',
  `payment_required` TINYINT(1) NOT NULL DEFAULT 0,
  `payment_status` VARCHAR(32) NOT NULL DEFAULT 'unpaid',
  `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `meeting_link` VARCHAR(1024) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bookings_patient` (`patient_user_id`),
  KEY `idx_bookings_clinic` (`clinic_id`),
  KEY `idx_bookings_doctor` (`doctor_id`),
  KEY `idx_bookings_status` (`status`),
  KEY `idx_bookings_payment_status` (`payment_status`),
  KEY `idx_bookings_patient_status` (`patient_user_id`, `status`),
  KEY `idx_bookings_patient_payment` (`patient_user_id`, `payment_status`),
  KEY `idx_bookings_clinic_status_payment` (`clinic_id`, `status`, `payment_status`),
  KEY `idx_bookings_clinic_created` (`clinic_id`, `created_at`),
  KEY `idx_bookings_created` (`created_at`),
  KEY `idx_bookings_slot` (`slot_id`),
  CONSTRAINT `fk_bookings_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_slot` FOREIGN KEY (`slot_id`) REFERENCES `schedule_slots` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- wallet_transactions (бүх үлдэгдэл өөрчлөлт — төлбөр, цэнэглэлт, буцаалт)
-- ---------------------------------------------------------------------------
CREATE TABLE `wallet_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `direction` ENUM('credit', 'debit') NOT NULL,
  `amount` DECIMAL(14, 2) NOT NULL,
  `balance_after` DECIMAL(14, 2) NOT NULL,
  `transaction_type` ENUM('top_up', 'booking_payment', 'booking_refund', 'admin_adjustment') NOT NULL,
  `reference_type` VARCHAR(32) NULL DEFAULT NULL,
  `reference_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `gateway_ref` VARCHAR(128) NULL DEFAULT NULL COMMENT 'mock:gateway:reference',
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wallet_tx_user_created` (`user_id`, `created_at`),
  KEY `idx_wallet_tx_type` (`transaction_type`),
  KEY `idx_wallet_tx_reference` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_wallet_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- medical_notes (эмчийн тэмдэглэл — захиалга/эмч/эмнэлэгт холбогдоно)
-- ---------------------------------------------------------------------------
CREATE TABLE `medical_notes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `booking_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `diagnosis` TEXT NULL,
  `doctor_notes` TEXT NULL,
  `recommendation` TEXT NULL,
  `treatment_plan` TEXT NULL,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_med_notes_patient` (`patient_user_id`),
  KEY `idx_med_notes_clinic` (`clinic_id`),
  KEY `idx_med_notes_doctor` (`doctor_id`),
  KEY `idx_med_notes_booking` (`booking_id`),
  CONSTRAINT `fk_med_notes_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_med_notes_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_med_notes_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_med_notes_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_med_notes_author` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- prescriptions (эмийн жор — өвчтөн, эмч, захиалга)
-- ---------------------------------------------------------------------------
CREATE TABLE `prescriptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `doctor_id` BIGINT UNSIGNED NOT NULL,
  `booking_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `medicine_name` VARCHAR(255) NOT NULL,
  `dosage` VARCHAR(255) NOT NULL,
  `instructions` TEXT NULL,
  `duration` VARCHAR(191) NOT NULL,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rx_patient` (`patient_user_id`),
  KEY `idx_rx_clinic` (`clinic_id`),
  KEY `idx_rx_doctor` (`doctor_id`),
  KEY `idx_rx_booking` (`booking_id`),
  CONSTRAINT `fk_rx_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rx_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rx_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_rx_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_rx_author` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- lab_test_results (шинжилгээний хариу — metadata; файл placeholder)
-- ---------------------------------------------------------------------------
CREATE TABLE `lab_test_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `doctor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `booking_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_placeholder` VARCHAR(512) NULL DEFAULT NULL,
  `notes` TEXT NULL,
  `source` ENUM('customer_uploaded', 'clinic_uploaded') NOT NULL,
  `created_by_user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lab_patient` (`patient_user_id`),
  KEY `idx_lab_clinic` (`clinic_id`),
  KEY `idx_lab_booking` (`booking_id`),
  KEY `idx_lab_source` (`source`),
  CONSTRAINT `fk_lab_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_author` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- lab_tests (шинжилгээ — үйлчлүүлэгч / эмнэлэг)
-- ---------------------------------------------------------------------------
CREATE TABLE `lab_tests` (
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
  `status` ENUM('submitted','completed','reviewed') NOT NULL DEFAULT 'submitted',
  `uploaded_by` ENUM('customer','clinic') NOT NULL DEFAULT 'customer',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- booking_lab_tests (захиалгад хуваалцсан шинжилгээ)
-- ---------------------------------------------------------------------------
CREATE TABLE `booking_lab_tests` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- consultation_requests
-- ---------------------------------------------------------------------------
CREATE TABLE `consultation_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NOT NULL,
  `doctor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `slot_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `request_type` VARCHAR(64) NOT NULL DEFAULT 'online',
  `consultation_type` VARCHAR(32) NOT NULL DEFAULT 'free_consultation',
  `is_free` TINYINT(1) NOT NULL DEFAULT 1,
  `status` ENUM('pending', 'accepted', 'closed', 'cancelled') NOT NULL DEFAULT 'pending',
  `meeting_link` VARCHAR(1024) NULL DEFAULT NULL,
  `patient_message` TEXT NULL,
  `symptoms` TEXT NULL,
  `question` TEXT NULL,
  `notes` TEXT NULL,
  `provider_message` TEXT NULL,
  `provider_notes` TEXT NULL,
  `chat_opened_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consult_patient` (`patient_user_id`),
  KEY `idx_consult_clinic` (`clinic_id`),
  KEY `idx_consult_doctor` (`doctor_id`),
  KEY `idx_consult_status` (`status`),
  KEY `idx_consult_created` (`created_at`),
  CONSTRAINT `fk_consult_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_consult_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_consult_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_consult_slot` FOREIGN KEY (`slot_id`) REFERENCES `schedule_slots` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- questionnaires
-- ---------------------------------------------------------------------------
CREATE TABLE `questionnaires` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `booking_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `consultation_request_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `answers_json` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_q_patient` (`patient_user_id`),
  KEY `idx_q_booking` (`booking_id`),
  KEY `idx_q_consult` (`consultation_request_id`),
  CONSTRAINT `fk_q_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_q_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_q_consult` FOREIGN KEY (`consultation_request_id`) REFERENCES `consultation_requests` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- chat_conversations (үйлчлүүлэгч ↔ эмнэлгийн эзэн, ирээдүйн WebSocket-д бэлэн)
-- ---------------------------------------------------------------------------
CREATE TABLE `chat_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT UNSIGNED NOT NULL,
  `provider_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `last_message` VARCHAR(500) NULL DEFAULT NULL,
  `last_message_at` TIMESTAMP NULL DEFAULT NULL,
  -- legacy-compatible field used by existing API/service code
  `last_message_preview` VARCHAR(500) NULL DEFAULT NULL,
  `last_message_sender_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_conv_clinic_customer_provider` (`clinic_id`, `customer_user_id`, `provider_user_id`),
  KEY `idx_chat_conv_customer` (`customer_user_id`),
  KEY `idx_chat_conv_provider` (`provider_user_id`),
  KEY `idx_chat_conv_last_message_at` (`last_message_at`),
  KEY `idx_chat_conv_customer_last` (`customer_user_id`, `last_message_at`, `id`),
  KEY `idx_chat_conv_provider_last` (`provider_user_id`, `last_message_at`, `id`),
  CONSTRAINT `fk_chat_conv_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_conv_customer` FOREIGN KEY (`customer_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_conv_provider` FOREIGN KEY (`provider_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_conv_last_sender` FOREIGN KEY (`last_message_sender_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_user_id` BIGINT UNSIGNED NOT NULL,
  `sender_role` VARCHAR(32) NULL DEFAULT NULL,
  `message_text` TEXT NOT NULL,
  -- legacy-compatible field used by existing API/service code
  `body` TEXT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_msg_conv_created` (`conversation_id`, `created_at`),
  KEY `idx_chat_msg_conversation_id` (`conversation_id`),
  KEY `idx_chat_msg_conv_id` (`conversation_id`, `id`),
  KEY `idx_chat_msg_sender_user_id` (`sender_user_id`),
  KEY `idx_chat_msg_conv_sender_id` (`conversation_id`, `sender_user_id`, `id`),
  KEY `idx_chat_msg_created_at` (`created_at`),
  CONSTRAINT `fk_chat_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_msg_sender` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- chat_participant_reads (unread тоолох — last_read_message_id)
-- ---------------------------------------------------------------------------
CREATE TABLE `chat_participant_reads` (
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `last_read_message_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`, `user_id`),
  KEY `idx_chat_read_user_conv` (`user_id`, `conversation_id`, `last_read_message_id`),
  CONSTRAINT `fk_chat_read_conv` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_read_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `type` VARCHAR(64) NOT NULL DEFAULT 'general',
  `reference_type` VARCHAR(32) NULL DEFAULT NULL,
  `reference_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `metadata` JSON NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_read` (`user_id`, `is_read`),
  KEY `idx_notif_created` (`created_at`),
  KEY `idx_notif_reference` (`reference_type`, `reference_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- doctor_reviews (үзлэг дууссан захиалгатай үйлчлүүлэгч)
-- ---------------------------------------------------------------------------
CREATE TABLE `doctor_reviews` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- reviews (legacy / clinic-level)
-- ---------------------------------------------------------------------------
CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `doctor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `comment` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_patient` (`patient_user_id`),
  KEY `idx_reviews_clinic` (`clinic_id`),
  KEY `idx_reviews_doctor` (`doctor_id`),
  KEY `idx_reviews_rating` (`rating`),
  CONSTRAINT `chk_reviews_rating_range` CHECK (`rating` >= 1 AND `rating` <= 5),
  CONSTRAINT `fk_reviews_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
