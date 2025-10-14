-- ============================================
-- COMPLETE SETUP FROM SCRATCH
-- ============================================
-- Creates profiles and sets up roles
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid := '1fc8dadc-a8e1-4722-85ce-32acad6f4060'; -- amangu89@gmail.com
  v_customer_user_id uuid := 'c91b93c0-8d7d-4959-962e-b743fb3438f3'; -- customer@aisme.com
  v_org_id uuid;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Complete Setup - Creating Everything';
  RAISE NOTICE '========================================';

  -- ============================================
  -- STEP 1: Create or get organization
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🏢 Setting up organization...';

  -- Get existing organization or create new one
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, description)
    VALUES ('RISEGRIT AUTOMOBILE SERVICES PVT LTD', 'Main organization')
    RETURNING id INTO v_org_id;
    RAISE NOTICE '   ✓ Created new organization: %', v_org_id;
  ELSE
    RAISE NOTICE '   ✓ Using existing organization: %', v_org_id;
  END IF;

  -- ============================================
  -- STEP 2: Create ADMIN profile
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👑 Setting up ADMIN: amangu89@gmail.com';

  -- Insert or update profile for admin
  INSERT INTO profiles (
    id,
    email,
    full_name,
    organization_id,
    created_at,
    updated_at
  ) VALUES (
    v_admin_user_id,
    'amangu89@gmail.com',
    'amangupta',
    v_org_id,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = 'amangu89@gmail.com',
    full_name = 'amangupta',
    organization_id = v_org_id,
    updated_at = NOW();

  RAISE NOTICE '   ✓ Profile created/updated';

  -- Add to organization_members
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

  RAISE NOTICE '   ✓ Role: owner';

  -- Clear existing permissions
  DELETE FROM user_module_permissions WHERE user_id = v_admin_user_id;

  -- Grant full access to all 12 modules
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

  -- ============================================
  -- STEP 3: Create CUSTOMER profile
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👤 Setting up CUSTOMER: customer@aisme.com';

  -- Insert or update profile for customer
  INSERT INTO profiles (
    id,
    email,
    full_name,
    organization_id,
    created_at,
    updated_at
  ) VALUES (
    v_customer_user_id,
    'customer@aisme.com',
    'Customer User',
    v_org_id,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = 'customer@aisme.com',
    organization_id = v_org_id,
    updated_at = NOW();

  RAISE NOTICE '   ✓ Profile created/updated';

  -- Add to organization_members
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

  RAISE NOTICE '   ✓ Role: staff';

  -- Clear existing permissions
  DELETE FROM user_module_permissions WHERE user_id = v_customer_user_id;

  -- Grant full access to 11 modules (all except admin portal)
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
  RAISE NOTICE '   ✓ Admin Portal: ❌ NO';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPLETE SETUP DONE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMIN: amangu89@gmail.com';
  RAISE NOTICE '   - Role: owner';
  RAISE NOTICE '   - Modules: 12/12';
  RAISE NOTICE '   - Admin Portal: YES ✅';
  RAISE NOTICE '';
  RAISE NOTICE '👤 CUSTOMER: customer@aisme.com';
  RAISE NOTICE '   - Role: staff';
  RAISE NOTICE '   - Modules: 11/12';
  RAISE NOTICE '   - Admin Portal: NO ❌';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check profiles
SELECT 
  '👥 PROFILES' as section,
  id,
  email,
  full_name,
  organization_id
FROM profiles
WHERE id IN (
  '1fc8dadc-a8e1-4722-85ce-32acad6f4060',
  'c91b93c0-8d7d-4959-962e-b743fb3438f3'
)
ORDER BY email;

-- Check organization members
SELECT 
  '🏢 ORGANIZATION MEMBERS' as section,
  p.email,
  om.role,
  om.is_active,
  CASE 
    WHEN om.role IN ('owner', 'manager') THEN '✅ Can access Admin Portal'
    ELSE '❌ Cannot access Admin Portal'
  END as admin_access
FROM organization_members om
JOIN profiles p ON p.id = om.user_id
WHERE om.user_id IN (
  '1fc8dadc-a8e1-4722-85ce-32acad6f4060',
  'c91b93c0-8d7d-4959-962e-b743fb3438f3'
)
ORDER BY om.role DESC;

-- Check permissions count
SELECT 
  '🔑 PERMISSIONS SUMMARY' as section,
  p.email,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled_modules
FROM profiles p
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.id IN (
  '1fc8dadc-a8e1-4722-85ce-32acad6f4060',
  'c91b93c0-8d7d-4959-962e-b743fb3438f3'
)
GROUP BY p.email
ORDER BY p.email;

-- Show all permissions detail
SELECT 
  '📋 DETAILED PERMISSIONS' as section,
  p.email,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as enabled
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.id IN (
  '1fc8dadc-a8e1-4722-85ce-32acad6f4060',
  'c91b93c0-8d7d-4959-962e-b743fb3438f3'
)
ORDER BY p.email, ump.module;
