-- ============================================
-- SETUP AUTOMATIC PROFILE CREATION ON USER SIGNUP
-- ============================================
-- 1. Add role_id column to profiles table
-- 2. Create trigger to auto-create profile when user signs up
-- 3. Set default role to 'Customer' (Level 2)
-- ============================================

-- Step 1: Add role_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES user_roles(id);

-- Step 2: Create or replace function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Get the 'Customer' role ID (default for new signups)
  SELECT id INTO default_role_id
  FROM user_roles
  WHERE role_name = 'Customer'
  LIMIT 1;

  -- Insert new profile with user's email and default role
  INSERT INTO public.profiles (id, email, full_name, role_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), -- Use full_name from metadata or email
    default_role_id,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Create trigger to run function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Update existing profiles to have the Customer role_id if they don't have one
UPDATE profiles
SET role_id = (
  SELECT id FROM user_roles WHERE role_name = 'Customer' LIMIT 1
)
WHERE role_id IS NULL
AND id NOT IN (
  -- Don't update system admins
  SELECT user_id FROM system_admins WHERE is_active = true
);

-- Step 6: Update system admin profiles to have the Admin role_id
UPDATE profiles
SET role_id = (
  SELECT id FROM user_roles WHERE role_name = 'Admin' LIMIT 1
)
WHERE id IN (
  SELECT user_id FROM system_admins WHERE is_active = true
);

-- Verify the setup
SELECT 
  '✅ Profile Auto-Creation Setup Complete' as status;

-- Check profiles with roles
SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role_name,
  CASE 
    WHEN sa.user_id IS NOT NULL THEN 'System Admin'
    ELSE 'Regular User'
  END as user_type,
  p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON p.role_id = ur.id
LEFT JOIN system_admins sa ON p.id = sa.user_id AND sa.is_active = true
ORDER BY p.created_at DESC
LIMIT 10;
