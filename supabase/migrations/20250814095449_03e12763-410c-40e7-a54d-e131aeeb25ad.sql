-- Create a quiz session if none exists
INSERT INTO public.quiz_sessions (id, is_active, registration_open, phase)
SELECT gen_random_uuid(), false, true, 'pre-quiz'
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_sessions);