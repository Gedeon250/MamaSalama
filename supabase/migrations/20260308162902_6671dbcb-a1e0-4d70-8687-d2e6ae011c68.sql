ALTER TABLE public.chat_conversations 
  ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS escalated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS patient_location text;