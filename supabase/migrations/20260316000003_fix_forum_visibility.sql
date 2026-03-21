-- Fix community forum: users need to see ALL posts, not just their own.
-- The security_invoker = true on the safe views was blocking this.
-- Recreating views with security_invoker = false (default) so the view
-- runs as the view owner (postgres/superuser), bypassing RLS and returning
-- all posts — while still masking user_id for anonymous content.

DROP VIEW IF EXISTS public.forum_posts_safe;
CREATE VIEW public.forum_posts_safe AS
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
  CASE WHEN is_anonymous = true THEN NULL ELSE user_id END AS user_id
FROM public.forum_posts;

GRANT SELECT ON public.forum_posts_safe TO authenticated, anon;

DROP VIEW IF EXISTS public.forum_replies_safe;
CREATE VIEW public.forum_replies_safe AS
SELECT
  id,
  post_id,
  content,
  is_anonymous,
  likes_count,
  created_at,
  CASE WHEN is_anonymous = true THEN NULL ELSE user_id END AS user_id
FROM public.forum_replies;

GRANT SELECT ON public.forum_replies_safe TO authenticated, anon;

-- Add trigger to keep likes_count accurate when users like/unlike posts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_post_likes_count
  AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
