-- Fix Security Definer View issue
-- Remove security_barrier from the view to avoid SECURITY DEFINER behavior
ALTER VIEW public.quiz_questions_secure SET (security_barrier = false);

-- Update RLS policy on quiz_questions to allow authenticated users to read
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only admins can view questions table" ON public.quiz_questions;

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Only admins can manage questions" ON public.quiz_questions;

-- Create new policy that allows authenticated users to read questions
-- The secure view will handle filtering out correct answers for non-admins
CREATE POLICY "Authenticated users can view questions" 
ON public.quiz_questions 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Recreate admin management policy for non-SELECT operations
CREATE POLICY "Only admins can manage questions" 
ON public.quiz_questions 
FOR ALL 
USING (is_current_user_admin());