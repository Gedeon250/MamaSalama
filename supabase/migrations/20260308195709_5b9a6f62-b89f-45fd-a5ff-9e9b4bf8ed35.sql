
CREATE TABLE public.breastfeeding_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  side TEXT NOT NULL DEFAULT 'left',
  feed_type TEXT NOT NULL DEFAULT 'breast',
  amount_ml INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.breastfeeding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feeding sessions" ON public.breastfeeding_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own feeding sessions" ON public.breastfeeding_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feeding sessions" ON public.breastfeeding_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own feeding sessions" ON public.breastfeeding_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feeding sessions" ON public.breastfeeding_sessions FOR SELECT USING (is_admin());
