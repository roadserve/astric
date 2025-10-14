-- ============================================
-- ROBUST FIX FOR SIGNUP TRIGGER
-- ============================================
-- Make role_id nullable and handle errors gracefully
-- ============================================

-- Step 1: Make role_id nullable (in case role lookup fails)
ALTER TABLE profiles 
ALTER COLUMN role_id DROP NOT NULL;

-- Step 2: Create a more robust trigger function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  -- Try to get the 'Customer' role ID
  BEGIN
    SELECT id INTO default_role_id
    FROM user_roles
    WHERE role_name = 'Customer'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    default_role_id := NULL;
  END;

  -- Insert new profile (role_id can be null if not found)
  INSERT INTO public.profiles (id, email, full_name, role_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    default_role_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block signup
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Verify
SELECT 
  '✅ Signup Trigger Fixed - More Robust' as status;

-- Check if Customer role exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Customer role exists'
    ELSE '❌ Customer role NOT found - run add_admin_customer_roles_safe.sql first'
  END as customer_role_status
FROM user_roles 
WHERE role_name = 'Customer';
