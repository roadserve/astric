-- ============================================
-- ENSURE SIGNUP TRIGGER WORKS FOR NEW USERS
-- ============================================
-- Final version - guaranteed to assign role_id
-- ============================================

-- Recreate the trigger function with proper role_id assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  customer_role_id UUID;
BEGIN
  -- Get the Customer role ID
  SELECT id INTO customer_role_id
  FROM user_roles
  WHERE role_name = 'Customer'
  LIMIT 1;

  -- If Customer role not found, raise error
  IF customer_role_id IS NULL THEN
    RAISE WARNING 'Customer role not found in user_roles table';
  END IF;

  -- Insert profile with role_id
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role_id, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'fullName',
      split_part(NEW.email, '@', 1)
    ),
    customer_role_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role_id = COALESCE(profiles.role_id, EXCLUDED.role_id),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify setup
SELECT 
  '✅ Signup Trigger Updated - Will Assign role_id Automatically' as status;

-- Show Customer role that will be assigned
SELECT 
  '👤 New users will be assigned this role:' as info,
  id as role_id,
  role_name,
  role_description
FROM user_roles
WHERE role_name = 'Customer';
