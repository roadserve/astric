-- Update user roles
-- Make amangu89@gmail.com an owner/admin

-- First, let's find the user ID for amangu89@gmail.com
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Get user ID from profiles
  SELECT id INTO v_user_id
  FROM profiles
  WHERE email = 'amangu89@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User amangu89@gmail.com not found in profiles table';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user ID: %', v_user_id;

  -- Get organization ID for this user
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'User is not a member of any organization';
    RETURN;
  END IF;

  RAISE NOTICE 'Found organization ID: %', v_org_id;

  -- Update user role to 'owner' in organization_members
  UPDATE organization_members
  SET role = 'owner'
  WHERE user_id = v_user_id
  AND organization_id = v_org_id;

  RAISE NOTICE 'Updated % to owner role', 'amangu89@gmail.com';

  -- Grant full permissions to all modules for this user
  INSERT INTO user_module_permissions (
    organization_id,
    user_id,
    module,
    permission_level,
    is_enabled,
    granted_by
  )
  SELECT 
    v_org_id,
    v_user_id,
    m.module,
    'full'::permission_level,
    true,
    v_user_id
  FROM (
    SELECT unnest(enum_range(NULL::system_module)) as module
  ) m
  ON CONFLICT (organization_id, user_id, module) 
  DO UPDATE SET 
    permission_level = 'full'::permission_level,
    is_enabled = true,
    updated_at = NOW();

  RAISE NOTICE 'Granted full permissions to all modules for amangu89@gmail.com';

END $$;

-- Verify the changes
SELECT 
  p.email,
  p.full_name,
  om.role,
  om.is_active,
  o.name as organization_name
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'amangu89@gmail.com';

-- Show all permissions for this user
SELECT 
  p.email,
  ump.module,
  ump.permission_level,
  ump.is_enabled
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email = 'amangu89@gmail.com'
ORDER BY ump.module;
