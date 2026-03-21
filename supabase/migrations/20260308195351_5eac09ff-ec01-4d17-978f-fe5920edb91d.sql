
-- Kick counter sessions table
CREATE TABLE public.kick_counter_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  kick_count INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kick_counter_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kick sessions" ON public.kick_counter_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own kick sessions" ON public.kick_counter_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own kick sessions" ON public.kick_counter_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own kick sessions" ON public.kick_counter_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all kick sessions" ON public.kick_counter_sessions FOR SELECT USING (is_admin());

-- Contraction timer sessions table
CREATE TABLE public.contraction_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contraction_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contraction sessions" ON public.contraction_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contraction sessions" ON public.contraction_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contraction sessions" ON public.contraction_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contraction sessions" ON public.contraction_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contraction sessions" ON public.contraction_sessions FOR SELECT USING (is_admin());

-- Individual contractions within a session
CREATE TABLE public.contractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.contraction_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  interval_seconds INTEGER,
  intensity TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contractions" ON public.contractions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contractions" ON public.contractions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contractions" ON public.contractions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contractions" ON public.contractions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all contractions" ON public.contractions FOR SELECT USING (is_admin());
