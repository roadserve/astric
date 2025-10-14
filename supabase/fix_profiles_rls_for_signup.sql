-- ============================================
-- FIX PROFILES TABLE RLS FOR SIGNUP
-- ============================================
-- Allow the trigger function to insert profiles automatically
-- when users sign up via Supabase Auth
-- ============================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Policy 1: Allow service role and authenticated users to insert profiles
-- This allows the trigger (which runs as service role) to create profiles
CREATE POLICY "Allow profile creation on signup" ON profiles
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  -- System admins can view all profiles
  auth.uid() IN (
    SELECT user_id 
    FROM system_admins 
    WHERE is_active = true
  )
);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: System admins can delete any profile
CREATE POLICY "System admins can delete profiles" ON profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM system_admins 
    WHERE is_active = true
  )
);

-- Verify the policies
SELECT 
  '✅ Profiles RLS Policies Fixed' as status;

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
