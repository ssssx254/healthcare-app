-- Phase 3: Safe chat core tables (idempotent, existing DB friendly)
-- NOTE:
-- - Avoid CHECK constraints (FK compatibility issues on some MySQL setups)
-- - Keep legacy-compatible columns if they already exist

SET @db = DATABASE();

-- ---------------------------------------------------------------------------
-- 1) chat_conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_conversations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_user_id` BIGINT UNSIGNED NOT NULL,
  `provider_user_id` BIGINT UNSIGNED NOT NULL,
  `clinic_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `last_message` VARCHAR(500) NULL DEFAULT NULL,
  `last_message_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'clinic_id'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_conversations ADD COLUMN clinic_id BIGINT UNSIGNED NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- clinic_id must be nullable for compatibility with partial records
SET @sql = 'ALTER TABLE chat_conversations MODIFY COLUMN clinic_id BIGINT UNSIGNED NULL DEFAULT NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'last_message'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_conversations ADD COLUMN last_message VARCHAR(500) NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'last_message_at'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_conversations ADD COLUMN last_message_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'created_at'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_conversations ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill last_message from legacy column when available
SET @has_last_message_preview = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND column_name = 'last_message_preview'
);
SET @sql = IF(
  @has_last_message_preview > 0,
  'UPDATE chat_conversations SET last_message = COALESCE(NULLIF(last_message, ''''), last_message_preview) WHERE last_message IS NULL OR last_message = ''''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys (carefully add only when missing)
SET @fk_exists = (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = @db AND table_name = 'chat_conversations' AND constraint_name = 'fk_chat_conv_customer'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE chat_conversations ADD CONSTRAINT fk_chat_conv_customer FOREIGN KEY (customer_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = @db AND table_name = 'chat_conversations' AND constraint_name = 'fk_chat_conv_provider'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE chat_conversations ADD CONSTRAINT fk_chat_conv_provider FOREIGN KEY (provider_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = @db AND table_name = 'chat_conversations' AND constraint_name = 'fk_chat_conv_clinic'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE chat_conversations ADD CONSTRAINT fk_chat_conv_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Helpful indexes
SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND index_name = 'idx_chat_conv_customer'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_conv_customer ON chat_conversations (customer_user_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND index_name = 'idx_chat_conv_provider'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_conv_provider ON chat_conversations (provider_user_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND index_name = 'idx_chat_conv_last_message_at'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_conv_last_message_at ON chat_conversations (last_message_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2) chat_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` BIGINT UNSIGNED NOT NULL,
  `sender_user_id` BIGINT UNSIGNED NOT NULL,
  `sender_role` VARCHAR(32) NULL DEFAULT NULL,
  `message_text` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_messages' AND column_name = 'sender_role'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_messages ADD COLUMN sender_role VARCHAR(32) NULL DEFAULT NULL AFTER sender_user_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_messages' AND column_name = 'message_text'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_messages ADD COLUMN message_text TEXT NULL AFTER sender_role',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_messages' AND column_name = 'is_read'
);
SET @sql = IF(
  @exists = 0,
  'ALTER TABLE chat_messages ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 AFTER message_text',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Keep compatibility with legacy `body` column and backfill both ways
SET @has_body = (
  SELECT COUNT(1) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'chat_messages' AND column_name = 'body'
);
SET @sql = IF(
  @has_body = 0,
  'ALTER TABLE chat_messages ADD COLUMN body TEXT NULL AFTER message_text',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  @has_body > 0,
  'UPDATE chat_messages SET message_text = COALESCE(NULLIF(message_text, ''''), body) WHERE message_text IS NULL OR message_text = ''''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = 'UPDATE chat_messages SET body = COALESCE(NULLIF(body, ''''), message_text) WHERE body IS NULL OR body = ''''';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = 'ALTER TABLE chat_messages MODIFY COLUMN message_text TEXT NOT NULL';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill sender_role using conversation participants
SET @sql = '
  UPDATE chat_messages m
  INNER JOIN chat_conversations c ON c.id = m.conversation_id
  SET m.sender_role = CASE
    WHEN m.sender_user_id = c.customer_user_id THEN ''customer''
    WHEN m.sender_user_id = c.provider_user_id THEN ''provider''
    ELSE COALESCE(NULLIF(m.sender_role, ''''), ''provider'')
  END
  WHERE m.sender_role IS NULL OR m.sender_role = ''''
';
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys
SET @fk_exists = (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = @db AND table_name = 'chat_messages' AND constraint_name = 'fk_chat_msg_conv'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_msg_conv FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(1) FROM information_schema.table_constraints
  WHERE constraint_schema = @db AND table_name = 'chat_messages' AND constraint_name = 'fk_chat_msg_sender'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE chat_messages ADD CONSTRAINT fk_chat_msg_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Required indexes
SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_messages' AND index_name = 'idx_chat_msg_conversation_id'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_msg_conversation_id ON chat_messages (conversation_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_messages' AND index_name = 'idx_chat_msg_sender_user_id'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_msg_sender_user_id ON chat_messages (sender_user_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_messages' AND index_name = 'idx_chat_msg_created_at'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_msg_created_at ON chat_messages (created_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

