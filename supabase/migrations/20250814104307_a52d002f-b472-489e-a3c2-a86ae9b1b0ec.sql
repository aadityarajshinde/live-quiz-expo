-- Create a secure view for quiz questions that excludes correct_answer for non-admin users
CREATE OR REPLACE VIEW public.quiz_questions_secure AS
SELECT 
  id,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  question_order,
  created_at,
  CASE 
    WHEN is_current_user_admin() THEN correct_answer
    ELSE NULL
  END as correct_answer
FROM public.quiz_questions;

-- Enable RLS on the view
ALTER VIEW public.quiz_questions_secure SET (security_barrier = true);

-- Grant permissions on the view
GRANT SELECT ON public.quiz_questions_secure TO authenticated;
GRANT SELECT ON public.quiz_questions_secure TO anon;

-- Update RLS policy for quiz_questions to be more restrictive
DROP POLICY IF EXISTS "Everyone can view questions" ON public.quiz_questions;

-- Create new restrictive policy - only admins can view the main table
CREATE POLICY "Only admins can view questions table" 
ON public.quiz_questions 
FOR SELECT 
USING (is_current_user_admin());

-- Create a function to get correct answer only when needed (for answer checking)
CREATE OR REPLACE FUNCTION public.check_quiz_answer(question_id uuid, submitted_answer character)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  correct_ans character;
BEGIN
  -- Get the correct answer
  SELECT correct_answer INTO correct_ans
  FROM public.quiz_questions
  WHERE id = question_id;
  
  -- Return whether the submitted answer is correct
  RETURN (correct_ans = submitted_answer);
END;
$$;