-- Phase 2: Chat API performance indexes (idempotent)

SET @db = DATABASE();

-- chat_conversations: user inbox ordering
SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND index_name = 'idx_chat_conv_customer_last'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_conv_customer_last ON chat_conversations (customer_user_id, last_message_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- chat_participant_reads: participant unread lookup
SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_participant_reads' AND index_name = 'idx_chat_read_user_conv'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_read_user_conv ON chat_participant_reads (user_id, conversation_id, last_read_message_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_conversations' AND index_name = 'idx_chat_conv_provider_last'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_conv_provider_last ON chat_conversations (provider_user_id, last_message_at, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- chat_messages: pagination and unread checks
SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_messages' AND index_name = 'idx_chat_msg_conv_id'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_msg_conv_id ON chat_messages (conversation_id, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists = (
  SELECT COUNT(1) FROM information_schema.statistics
  WHERE table_schema = @db AND table_name = 'chat_messages' AND index_name = 'idx_chat_msg_conv_sender_id'
);
SET @sql = IF(
  @exists = 0,
  'CREATE INDEX idx_chat_msg_conv_sender_id ON chat_messages (conversation_id, sender_user_id, id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

