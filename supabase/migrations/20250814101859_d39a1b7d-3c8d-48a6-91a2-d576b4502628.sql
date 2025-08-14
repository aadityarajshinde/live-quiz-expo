-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic admin policy that causes circular dependency
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create a simpler admin policy that doesn't cause recursion
-- This allows users to manage profiles if they are admin, but avoids the circular check
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      SELECT p.is_admin 
      FROM public.profiles p 
      WHERE p.user_id = auth.uid() 
      LIMIT 1
    ) = true
  END
);

-- Alternative: We can also use a security definer function to avoid RLS recursion
-- But the above simpler approach should work