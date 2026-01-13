-- ============================================
-- UPDATE TRIGGER TO SAVE PHONE NUMBER
-- ============================================
-- Add phone column to profiles and update trigger
-- ============================================

-- Step 1: Add phone column to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Step 2: Update trigger function to save phone
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

  -- If Customer role not found, raise warning
  IF customer_role_id IS NULL THEN
    RAISE WARNING 'Customer role not found in user_roles table';
  END IF;

  -- Insert profile with role_id and phone
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    phone,
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
    NEW.raw_user_meta_data->>'phone',
    customer_role_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role_id = COALESCE(profiles.role_id, EXCLUDED.role_id),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify
SELECT 
  '✅ Trigger Updated - Now Saves Phone Number' as status;

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('email', 'phone', 'full_name', 'role_id')
ORDER BY ordinal_position;
