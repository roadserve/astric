-- ============================================
-- FINAL SETUP - RUN THIS!
-- ============================================
-- Uses correct user IDs from auth.users
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid := '1fc8dac6-a8e1-47d2-85ce-32aced614060'; -- amangu89@gmail.com
  v_customer_user_id uuid := 'c91b93c0-8d7d-4959-962e-b7437b3438f3'; -- customer@aisme.com
  v_org_id uuid;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL SETUP - Admin & Customer';
  RAISE NOTICE '========================================';

  -- ============================================
  -- STEP 1: Get or create organization
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🏢 Setting up organization...';

  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, description)
    VALUES ('RISEGRIT AUTOMOBILE SERVICES PVT LTD', 'Main organization')
    RETURNING id INTO v_org_id;
    RAISE NOTICE '   ✓ Created organization: %', v_org_id;
  ELSE
    RAISE NOTICE '   ✓ Using organization: %', v_org_id;
  END IF;

  -- ============================================
  -- STEP 2: Setup ADMIN (amangu89@gmail.com)
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👑 Setting up ADMIN: amangu89@gmail.com';

  -- Create or update profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    organization_id
  ) VALUES (
    v_admin_user_id,
    'amangu89@gmail.com',
    'amangupta',
    v_org_id
  ) ON CONFLICT (id) DO UPDATE SET
    email = 'amangu89@gmail.com',
    full_name = 'amangupta',
    organization_id = v_org_id,
    updated_at = NOW();

  RAISE NOTICE '   ✓ Profile created';

  -- Add to organization_members with OWNER role
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_active
  ) VALUES (
    v_org_id,
    v_admin_user_id,
    'owner',
    true
  ) ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role = 'owner',
    is_active = true;

  RAISE NOTICE '   ✓ Role: OWNER';

  -- Clear existing permissions
  DELETE FROM user_module_permissions WHERE user_id = v_admin_user_id;

  -- Grant FULL access to ALL 12 modules
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
    v_admin_user_id,
    unnest(enum_range(NULL::system_module)),
    'full'::permission_level,
    true,
    v_admin_user_id;

  RAISE NOTICE '   ✓ Permissions: 12/12 modules (FULL)';
  RAISE NOTICE '   ✓ Admin Portal: ✅ YES';
  RAISE NOTICE '   ✅ ADMIN SETUP COMPLETE';

  -- ============================================
  -- STEP 3: Setup CUSTOMER (customer@aisme.com)
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👤 Setting up CUSTOMER: customer@aisme.com';

  -- Create or update profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    organization_id
  ) VALUES (
    v_customer_user_id,
    'customer@aisme.com',
    'Customer User',
    v_org_id
  ) ON CONFLICT (id) DO UPDATE SET
    email = 'customer@aisme.com',
    organization_id = v_org_id,
    updated_at = NOW();

  RAISE NOTICE '   ✓ Profile created';

  -- Add to organization_members with STAFF role
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    is_active
  ) VALUES (
    v_org_id,
    v_customer_user_id,
    'staff',
    true
  ) ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role = 'staff',
    is_active = true;

  RAISE NOTICE '   ✓ Role: STAFF (Customer)';

  -- Clear existing permissions
  DELETE FROM user_module_permissions WHERE user_id = v_customer_user_id;

  -- Grant FULL access to 11 modules (ALL EXCEPT Admin Portal)
  INSERT INTO user_module_permissions (
    organization_id,
    user_id,
    module,
    permission_level,
    is_enabled,
    granted_by
  )
  VALUES
    (v_org_id, v_customer_user_id, 'dashboard', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'billing', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'payroll', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'whatsapp_crm', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'social_media', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'gmb', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'analytics', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'customers', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'products', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'attendance', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'ai_copilot', 'full', true, v_admin_user_id),
    (v_org_id, v_customer_user_id, 'settings', 'full', true, v_admin_user_id);

  RAISE NOTICE '   ✓ Permissions: 11/12 modules (FULL)';
  RAISE NOTICE '   ✓ Admin Portal: ❌ NO (Blocked)';
  RAISE NOTICE '   ✅ CUSTOMER SETUP COMPLETE';

  -- ============================================
  -- SUMMARY
  -- ============================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMIN:';
  RAISE NOTICE '   Email: amangu89@gmail.com';
  RAISE NOTICE '   Name: amangupta';
  RAISE NOTICE '   Role: OWNER';
  RAISE NOTICE '   Modules: 12/12 (Full Access)';
  RAISE NOTICE '   Admin Portal: ✅ YES';
  RAISE NOTICE '';
  RAISE NOTICE '👤 CUSTOMER:';
  RAISE NOTICE '   Email: customer@aisme.com';
  RAISE NOTICE '   Name: Customer User';
  RAISE NOTICE '   Role: STAFF';
  RAISE NOTICE '   Modules: 11/12 (Full Access)';
  RAISE NOTICE '   Admin Portal: ❌ NO';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'You can now login and test!';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- 1. Show profiles
SELECT 
  '👥 PROFILES' as section,
  p.email,
  p.full_name,
  o.name as organization
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY p.email;

-- 2. Show roles
SELECT 
  '🏢 ORGANIZATION ROLES' as section,
  p.email,
  om.role,
  om.is_active,
  CASE 
    WHEN om.role IN ('owner', 'manager') THEN '✅ Can access Admin Portal'
    ELSE '❌ Cannot access Admin Portal'
  END as admin_portal_access
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY om.role DESC;

-- 3. Show permission counts
SELECT 
  '🔑 PERMISSIONS SUMMARY' as section,
  p.email,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled_modules,
  COUNT(CASE WHEN ump.permission_level = 'full' THEN 1 END) as full_access_modules
FROM profiles p
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
GROUP BY p.email
ORDER BY p.email;

-- 4. Show detailed permissions for admin
SELECT 
  '👑 ADMIN PERMISSIONS (12 modules)' as section,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as enabled
FROM user_module_permissions ump
JOIN profiles p ON p.id = ump.user_id
WHERE p.email = 'amangu89@gmail.com'
ORDER BY ump.module;

-- 5. Show detailed permissions for customer
SELECT 
  '👤 CUSTOMER PERMISSIONS (11 modules)' as section,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as enabled
FROM user_module_permissions ump
JOIN profiles p ON p.id = ump.user_id
WHERE p.email = 'customer@aisme.com'
ORDER BY ump.module;
