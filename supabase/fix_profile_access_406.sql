-- Fix 406 (Not Acceptable) errors for profile access
-- This happens when users don't have an organization yet

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new, more permissive policies for authenticated users
CREATE POLICY "Authenticated users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow service role full access (for backend operations)
CREATE POLICY "Service role full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true);

-- System admins can view all profiles
CREATE POLICY "System admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM system_admins
    WHERE system_admins.user_id = auth.uid()
    AND system_admins.is_active = true
  )
);

COMMENT ON POLICY "Authenticated users can view own profile" ON profiles IS 
'Allows authenticated users to view their own profile, even before organization setup';

