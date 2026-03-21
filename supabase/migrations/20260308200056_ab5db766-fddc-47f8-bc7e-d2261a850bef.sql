
-- Sleep logs table
CREATE TABLE public.sleep_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  sleep_type TEXT NOT NULL DEFAULT 'nap',
  quality TEXT DEFAULT 'good',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sleep logs" ON public.sleep_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sleep logs" ON public.sleep_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep logs" ON public.sleep_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep logs" ON public.sleep_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sleep logs" ON public.sleep_logs FOR SELECT USING (is_admin());

-- Diaper logs table
CREATE TABLE public.diaper_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  change_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  diaper_type TEXT NOT NULL DEFAULT 'wet',
  color TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diaper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diaper logs" ON public.diaper_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own diaper logs" ON public.diaper_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own diaper logs" ON public.diaper_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diaper logs" ON public.diaper_logs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all diaper logs" ON public.diaper_logs FOR SELECT USING (is_admin());
