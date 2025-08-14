-- Update the advance_quiz_phase function to reduce results phase to 10 seconds
CREATE OR REPLACE FUNCTION public.advance_quiz_phase()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  active_session record;
  next_question record;
  results_end_time timestamp with time zone;
  question_end_time timestamp with time zone;
BEGIN
  -- Get active session
  SELECT * INTO active_session
  FROM public.quiz_sessions
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Exit if no active session
  IF active_session IS NULL THEN
    RETURN;
  END IF;

  -- Check if phase time has expired
  IF active_session.phase_end_time IS NULL OR NOW() < active_session.phase_end_time THEN
    RETURN;
  END IF;

  -- Handle phase transitions
  IF active_session.phase = 'question' THEN
    -- Move to results phase (10 seconds instead of 20)
    results_end_time := NOW() + INTERVAL '10 seconds';
    
    UPDATE public.quiz_sessions
    SET 
      phase = 'results',
      phase_end_time = results_end_time,
      updated_at = NOW()
    WHERE id = active_session.id;

  ELSIF active_session.phase = 'results' THEN
    -- Try to get next question
    SELECT * INTO next_question
    FROM public.quiz_questions
    WHERE question_order > active_session.current_question_number
    ORDER BY question_order
    LIMIT 1;

    IF next_question IS NOT NULL THEN
      -- Move to next question (40 seconds)
      question_end_time := NOW() + INTERVAL '40 seconds';
      
      UPDATE public.quiz_sessions
      SET 
        phase = 'question',
        current_question_id = next_question.id,
        current_question_number = active_session.current_question_number + 1,
        phase_end_time = question_end_time,
        updated_at = NOW()
      WHERE id = active_session.id;
    ELSE
      -- No more questions, finish quiz
      UPDATE public.quiz_sessions
      SET 
        phase = 'finished',
        is_active = false,
        phase_end_time = NULL,
        updated_at = NOW()
      WHERE id = active_session.id;
    END IF;
  END IF;
END;
$function$