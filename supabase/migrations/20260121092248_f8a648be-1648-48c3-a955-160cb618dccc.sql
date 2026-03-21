-- Create a secure view for forum posts that hides user_id for anonymous posts
CREATE OR REPLACE VIEW public.forum_posts_safe AS
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

-- Create a secure view for forum replies that hides user_id for anonymous replies
CREATE OR REPLACE VIEW public.forum_replies_safe AS
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