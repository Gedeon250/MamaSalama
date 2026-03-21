
CREATE TABLE public.health_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT NOT NULL DEFAULT 'okay',
  energy_level INTEGER DEFAULT 3,
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  water_glasses INTEGER DEFAULT 0,
  sleep_hours NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journal" ON public.health_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal" ON public.health_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal" ON public.health_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal" ON public.health_journal FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all journals" ON public.health_journal FOR SELECT USING (is_admin());

CREATE UNIQUE INDEX health_journal_user_date ON public.health_journal (user_id, date);
