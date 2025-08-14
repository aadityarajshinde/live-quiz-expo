-- Create admin user and profile
-- First, we need to insert the admin user into auth.users (this is a one-time setup)
-- Note: In production, you would typically create this through the Supabase dashboard

-- Insert admin profile directly (the trigger will handle profile creation when the user signs up)
-- For now, let's ensure the admin profile exists
INSERT INTO public.profiles (user_id, email, name, is_admin) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@liveexpoquiz.com',
  'Quiz Administrator',
  true
) ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- Create a quiz session if none exists
INSERT INTO public.quiz_sessions (id, is_active, registration_open, phase)
VALUES (
  gen_random_uuid(),
  false,
  true,
  'pre-quiz'
) ON CONFLICT DO NOTHING;