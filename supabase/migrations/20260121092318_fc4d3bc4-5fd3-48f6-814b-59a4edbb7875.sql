-- Drop and recreate the views with SECURITY INVOKER to respect RLS of the querying user
DROP VIEW IF EXISTS public.forum_posts_safe;
DROP VIEW IF EXISTS public.forum_replies_safe;

-- Create forum_posts_safe view with SECURITY INVOKER
CREATE VIEW public.forum_posts_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  content,
  topic,
  is_anonymous,
  likes_count,
  replies_count,
  created_at,
  updated_at,
  CASE 
    WHEN is_anonymous = true THEN NULL 
    ELSE user_id 
  END AS user_id
FROM public.forum_posts;

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.forum_posts_safe TO authenticated, anon;

-- Create forum_replies_safe view with SECURITY INVOKER
CREATE VIEW public.forum_replies_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  post_id,
  content,
  is_anonymous,
  likes_count,
  created_at,
  CASE 
    WHEN is_anonymous = true THEN NULL 
    ELSE user_id 
  END AS user_id
FROM public.forum_replies;

-- Grant access to the view for authenticated and anon users
GRANT SELECT ON public.forum_replies_safe TO authenticated, anon;