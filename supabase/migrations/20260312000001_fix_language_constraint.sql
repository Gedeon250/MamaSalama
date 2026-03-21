-- Fix language constraint to support 'rw' (Kinyarwanda) in addition to 'en' and 'sw'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_language_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_language_check
  CHECK (language IN ('en', 'sw', 'rw'));

-- Migrate any existing 'sw' values to 'rw' for consistency with the app's i18n system
UPDATE public.profiles SET language = 'rw' WHERE language = 'sw';
