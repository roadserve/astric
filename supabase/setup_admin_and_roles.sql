-- ============================================
-- SETUP ADMIN AND USER ROLES
-- ============================================
-- This script will:
-- 1. Make amangu89@gmail.com an owner with full permissions
-- 2. Set all other users to staff role with basic permissions
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid;
  v_admin_org_id uuid;
  v_user record;
  v_total_users int := 0;
  v_updated_users int := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting Admin and Roles Setup';
  RAISE NOTICE '========================================';

  -- ============================================
  -- STEP 1: Setup Admin User (amangu89@gmail.com)
  -- ============================================
  
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM profiles
  WHERE email = 'amangu89@gmail.com';

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user amangu89@gmail.com not found in profiles table';
  END IF;

  RAISE NOTICE '✓ Found admin user: amangu89@gmail.com (ID: %)', v_admin_user_id;

  -- Get admin organization
  SELECT organization_id INTO v_admin_org_id
  FROM organization_members
  WHERE user_id = v_admin_user_id
  LIMIT 1;

  IF v_admin_org_id IS NULL THEN
    RAISE EXCEPTION 'Admin user is not a member of any organization';
  END IF;

  RAISE NOTICE '✓ Found organization (ID: %)', v_admin_org_id;

  -- Update admin to owner role
  UPDATE organization_members
  SET role = 'owner'
  WHERE user_id = v_admin_user_id
  AND organization_id = v_admin_org_id;

  RAISE NOTICE '✓ Updated amangu89@gmail.com to OWNER role';

  -- Delete existing permissions for admin
  DELETE FROM user_module_permissions
  WHERE user_id = v_admin_user_id
  AND organization_id = v_admin_org_id;

  -- Grant full permissions to all modules for admin
  INSERT INTO user_module_permissions (
    organization_id,
    user_id,
    module,
    permission_level,
    is_enabled,
    granted_by
  )
  SELECT 
    v_admin_org_id,
    v_admin_user_id,
    m.module,
    'full'::permission_level,
    true,
    v_admin_user_id
  FROM (
    SELECT unnest(enum_range(NULL::system_module)) as module
  ) m;

  RAISE NOTICE '✓ Granted FULL permissions to all 12 modules for admin';

  -- ============================================
  -- STEP 2: Setup Other Users (Staff Role)
  -- ============================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up other users...';
  RAISE NOTICE '========================================';

  -- Count total users
  SELECT COUNT(*) INTO v_total_users
  FROM organization_members om
  JOIN profiles p ON p.id = om.user_id
  WHERE om.user_id != v_admin_user_id
  AND om.organization_id = v_admin_org_id;

  RAISE NOTICE 'Found % other users to update', v_total_users;

  -- Update each user
  FOR v_user IN 
    SELECT om.user_id, om.organization_id, p.email, p.full_name
    FROM organization_members om
    JOIN profiles p ON p.id = om.user_id
    WHERE om.user_id != v_admin_user_id
    AND om.organization_id = v_admin_org_id
  LOOP
    v_updated_users := v_updated_users + 1;

    -- Update role to staff
    UPDATE organization_members
    SET role = 'staff'
    WHERE user_id = v_user.user_id
    AND organization_id = v_user.organization_id;

    -- Delete existing permissions
    DELETE FROM user_module_permissions
    WHERE user_id = v_user.user_id
    AND organization_id = v_user.organization_id;

    -- Grant basic permissions (Dashboard and Analytics view only)
    INSERT INTO user_module_permissions (
      organization_id,
      user_id,
      module,
      permission_level,
      is_enabled,
      granted_by
    )
    VALUES
      (v_user.organization_id, v_user.user_id, 'dashboard'::system_module, 'view'::permission_level, true, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'billing'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'payroll'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'whatsapp_crm'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'social_media'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'gmb'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'analytics'::system_module, 'view'::permission_level, true, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'customers'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'products'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'attendance'::system_module, 'view'::permission_level, true, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'ai_copilot'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'settings'::system_module, 'none'::permission_level, false, v_admin_user_id);

    RAISE NOTICE '  ✓ Updated % (%) to STAFF role with basic permissions', COALESCE(v_user.full_name, 'Unknown'), v_user.email;
  END LOOP;

  -- ============================================
  -- SUMMARY
  -- ============================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin: amangu89@gmail.com → OWNER (Full Access)';
  RAISE NOTICE 'Other Users: % users → STAFF (Limited Access)', v_updated_users;
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show all users and their roles
SELECT 
  '👥 ALL USERS & ROLES' as section,
  p.email,
  p.full_name,
  om.role,
  CASE 
    WHEN om.role = 'owner' THEN '🔓 Full Access'
    WHEN om.role = 'manager' THEN '🔓 Full Access'
    ELSE '🔒 Limited Access'
  END as access_level,
  om.is_active
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
ORDER BY 
  CASE om.role 
    WHEN 'owner' THEN 1 
    WHEN 'manager' THEN 2 
    ELSE 3 
  END,
  p.email;

-- Show admin permissions
SELECT 
  '🔑 ADMIN PERMISSIONS' as section,
  p.email,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅ Enabled' ELSE '❌ Disabled' END as status
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email = 'amangu89@gmail.com'
ORDER BY ump.module;

-- Show staff permissions summary
SELECT 
  '📊 STAFF PERMISSIONS SUMMARY' as section,
  p.email,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled_modules,
  COUNT(*) as total_modules
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email != 'amangu89@gmail.com'
GROUP BY p.email
ORDER BY p.email;
