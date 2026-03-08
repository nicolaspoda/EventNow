-- Rollback migration for messaging system
-- Use this file if you need to undo the messaging system changes

-- Drop foreign keys first
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_conversation_id_fkey";
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_fkey";
ALTER TABLE "conversation_members" DROP CONSTRAINT IF EXISTS "conversation_members_conversation_id_fkey";
ALTER TABLE "conversation_members" DROP CONSTRAINT IF EXISTS "conversation_members_user_id_fkey";

-- Drop tables
DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "conversation_members";
DROP TABLE IF EXISTS "conversations";

-- Drop enum
DROP TYPE IF EXISTS "ConversationType";
