-- Fix chat_conversations status constraint to allow 'escalated' status
-- The assess-risk edge function sets status = 'escalated' for high-risk cases
ALTER TABLE public.chat_conversations
  DROP CONSTRAINT IF EXISTS chat_conversations_status_check;

ALTER TABLE public.chat_conversations
  ADD CONSTRAINT chat_conversations_status_check
  CHECK (status IN ('open', 'assigned', 'closed', 'escalated'));
