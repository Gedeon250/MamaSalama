
CREATE TABLE public.sms_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  user_id uuid DEFAULT NULL,
  session_data jsonb DEFAULT '{}'::jsonb,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sms sessions" ON public.sms_sessions
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can update sms sessions" ON public.sms_sessions
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete sms sessions" ON public.sms_sessions
  FOR DELETE TO authenticated USING (is_admin());

CREATE TABLE public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  direction text NOT NULL DEFAULT 'inbound',
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'chat',
  status text NOT NULL DEFAULT 'sent',
  session_id uuid REFERENCES public.sms_sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all sms messages" ON public.sms_messages
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admins can create sms messages" ON public.sms_messages
  FOR INSERT TO authenticated WITH CHECK (is_admin());
