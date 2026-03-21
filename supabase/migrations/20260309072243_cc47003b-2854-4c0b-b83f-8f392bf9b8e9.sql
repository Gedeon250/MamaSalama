
-- Drop the unrestricted SELECT policy on forum_posts
DROP POLICY IF EXISTS "All users can view forum posts" ON public.forum_posts;

-- Allow users to view only their own posts directly
CREATE POLICY "Users can view their own posts"
  ON public.forum_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to view all posts
CREATE POLICY "Admins can view all forum posts"
  ON public.forum_posts
  FOR SELECT
  TO authenticated
  USING (is_admin());
