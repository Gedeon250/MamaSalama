-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

-- Update profiles table to allow admin read access
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- Allow admins to view all children
CREATE POLICY "Admins can view all children"
ON public.children
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all children"
ON public.children
FOR UPDATE
USING (public.is_admin());

-- Allow admins to view all reminders
CREATE POLICY "Admins can view all reminders"
ON public.reminders
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all reminders"
ON public.reminders
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete all reminders"
ON public.reminders
FOR DELETE
USING (public.is_admin());

-- Allow admins to view all vaccinations
CREATE POLICY "Admins can view all vaccinations"
ON public.vaccinations
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all vaccinations"
ON public.vaccinations
FOR UPDATE
USING (public.is_admin());

-- Allow admins to view all milestones
CREATE POLICY "Admins can view all milestones"
ON public.milestones
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all milestones"
ON public.milestones
FOR UPDATE
USING (public.is_admin());

-- Allow admins to view all growth logs
CREATE POLICY "Admins can view all growth logs"
ON public.growth_logs
FOR SELECT
USING (public.is_admin());