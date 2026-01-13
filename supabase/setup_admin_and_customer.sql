-- ============================================
-- SETUP ADMIN AND CUSTOMER ROLES
-- ============================================
-- Admin: amangu89@gmail.com (AI SME Owner - Full Access + Admin Portal)
-- Customer: customer@aisme.com (Client - Full Access EXCEPT Admin Portal)
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid;
  v_customer_user_id uuid;
  v_admin_org_id uuid;
  v_customer_org_id uuid;
  v_customer_profile_exists boolean;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up Admin and Customer Users';
  RAISE NOTICE '========================================';

  -- ============================================
  -- STEP 1: Setup Admin User (amangu89@gmail.com)
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '1. Setting up ADMIN user...';
  
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM profiles
  WHERE email = 'amangu89@gmail.com';

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user amangu89@gmail.com not found in profiles table';
  END IF;

  RAISE NOTICE '   ✓ Found admin user: amangu89@gmail.com';

  -- Get admin organization
  SELECT organization_id INTO v_admin_org_id
  FROM organization_members
  WHERE user_id = v_admin_user_id
  LIMIT 1;

  IF v_admin_org_id IS NULL THEN
    RAISE EXCEPTION 'Admin user is not a member of any organization';
  END IF;

  RAISE NOTICE '   ✓ Found organization for admin';

  -- Set admin role to OWNER
  UPDATE organization_members
  SET role = 'owner'
  WHERE user_id = v_admin_user_id
  AND organization_id = v_admin_org_id;

  RAISE NOTICE '   ✓ Set role to OWNER';

  -- Delete existing permissions for admin
  DELETE FROM user_module_permissions
  WHERE user_id = v_admin_user_id
  AND organization_id = v_admin_org_id;

  -- Grant FULL permissions to ALL modules (including admin portal access)
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

  RAISE NOTICE '   ✓ Granted FULL access to all 12 modules';
  RAISE NOTICE '   ✓ ADMIN SETUP COMPLETE';

  -- ============================================
  -- STEP 2: Setup Customer User (customer@aisme.com)
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '2. Setting up CUSTOMER user...';

  -- Check if customer profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = 'customer@aisme.com') 
  INTO v_customer_profile_exists;

  IF NOT v_customer_profile_exists THEN
    RAISE NOTICE '   ⚠ Customer user customer@aisme.com not found';
    RAISE NOTICE '   ⚠ Please create this user first through signup';
    RAISE NOTICE '   ⚠ Then run this script again';
  ELSE
    -- Get customer user ID
    SELECT id INTO v_customer_user_id
    FROM profiles
    WHERE email = 'customer@aisme.com';

    RAISE NOTICE '   ✓ Found customer user: customer@aisme.com';

    -- Get or create organization for customer
    SELECT organization_id INTO v_customer_org_id
    FROM organization_members
    WHERE user_id = v_customer_user_id
    LIMIT 1;

    IF v_customer_org_id IS NULL THEN
      RAISE NOTICE '   ⚠ Customer not in any organization, using admin org';
      v_customer_org_id := v_admin_org_id;
      
      -- Add customer to organization
      INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        is_active
      ) VALUES (
        v_customer_org_id,
        v_customer_user_id,
        'staff',
        true
      ) ON CONFLICT (organization_id, user_id) DO UPDATE
      SET role = 'staff';
    END IF;

    RAISE NOTICE '   ✓ Customer organization set';

    -- Set customer role to STAFF (not admin)
    UPDATE organization_members
    SET role = 'staff'
    WHERE user_id = v_customer_user_id
    AND organization_id = v_customer_org_id;

    RAISE NOTICE '   ✓ Set role to STAFF (Customer)';

    -- Delete existing permissions for customer
    DELETE FROM user_module_permissions
    WHERE user_id = v_customer_user_id
    AND organization_id = v_customer_org_id;

    -- Grant FULL permissions to ALL modules EXCEPT admin portal
    INSERT INTO user_module_permissions (
      organization_id,
      user_id,
      module,
      permission_level,
      is_enabled,
      granted_by
    )
    VALUES
      (v_customer_org_id, v_customer_user_id, 'dashboard'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'billing'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'payroll'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'whatsapp_crm'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'social_media'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'gmb'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'analytics'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'customers'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'products'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'attendance'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'ai_copilot'::system_module, 'full'::permission_level, true, v_admin_user_id),
      (v_customer_org_id, v_customer_user_id, 'settings'::system_module, 'full'::permission_level, true, v_admin_user_id);

    RAISE NOTICE '   ✓ Granted FULL access to 11 modules (excluding Admin Portal)';
    RAISE NOTICE '   ✓ CUSTOMER SETUP COMPLETE';
  END IF;

  -- ============================================
  -- SUMMARY
  -- ============================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMIN (AI SME Owner):';
  RAISE NOTICE '   Email: amangu89@gmail.com';
  RAISE NOTICE '   Role: OWNER';
  RAISE NOTICE '   Access: FULL (12/12 modules)';
  RAISE NOTICE '   Admin Portal: ✅ YES';
  RAISE NOTICE '';
  
  IF v_customer_profile_exists THEN
    RAISE NOTICE '👤 CUSTOMER (Client):';
    RAISE NOTICE '   Email: customer@aisme.com';
    RAISE NOTICE '   Role: STAFF (Customer)';
    RAISE NOTICE '   Access: FULL (11/12 modules)';
    RAISE NOTICE '   Admin Portal: ❌ NO';
  ELSE
    RAISE NOTICE '⚠️  CUSTOMER user not found';
    RAISE NOTICE '   Please create customer@aisme.com account';
    RAISE NOTICE '   Then run this script again';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show both users and their roles
SELECT 
  '👥 USER ROLES' as section,
  p.email,
  p.full_name,
  om.role,
  CASE 
    WHEN om.role = 'owner' THEN '👑 Admin (AI SME Owner)'
    ELSE '👤 Customer (Client)'
  END as user_type,
  om.is_active
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY 
  CASE om.role WHEN 'owner' THEN 1 ELSE 2 END;

-- Show admin permissions (should be 12 modules)
SELECT 
  '👑 ADMIN PERMISSIONS (12 modules)' as section,
  p.email,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as status
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email = 'amangu89@gmail.com'
ORDER BY ump.module;

-- Show customer permissions (should be 11 modules, no admin portal)
SELECT 
  '👤 CUSTOMER PERMISSIONS (11 modules)' as section,
  p.email,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as status
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email = 'customer@aisme.com'
ORDER BY ump.module;

-- Summary comparison
SELECT 
  '📊 ACCESS SUMMARY' as section,
  p.email,
  om.role,
  COUNT(ump.module) as total_modules,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled_modules,
  CASE 
    WHEN om.role = 'owner' THEN 'Can access Admin Portal ✅'
    ELSE 'Cannot access Admin Portal ❌'
  END as admin_portal_access
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
GROUP BY p.email, om.role
ORDER BY om.role DESC;
