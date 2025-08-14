-- Fix infinite recursion by creating a security definer function
-- This function can bypass RLS to check admin status

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create a security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- Create admin policy using the security definer function
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_current_user_admin());

-- Also update other policies that might have similar issues
-- Check quiz_sessions policies
DROP POLICY IF EXISTS "Only admins can manage sessions" ON public.quiz_sessions;

CREATE POLICY "Only admins can manage sessions" 
ON public.quiz_sessions 
FOR ALL 
USING (public.is_current_user_admin());

-- Check quiz_questions policies  
DROP POLICY IF EXISTS "Only admins can manage questions" ON public.quiz_questions;

CREATE POLICY "Only admins can manage questions" 
ON public.quiz_questions 
FOR ALL 
USING (public.is_current_user_admin());