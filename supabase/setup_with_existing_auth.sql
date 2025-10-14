-- ============================================
-- SETUP WITH EXISTING AUTH USERS
-- ============================================
-- Works with users that exist in auth.users
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid;
  v_customer_user_id uuid;
  v_org_id uuid;
  v_admin_email text := 'amangu89@gmail.com';
  v_customer_email text := 'customer@aisme.com';
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up roles from auth.users';
  RAISE NOTICE '========================================';

  -- ============================================
  -- STEP 1: Find users in auth.users
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Looking for users in auth.users...';

  -- Find admin user
  SELECT id INTO v_admin_user_id
  FROM auth.users
  WHERE email = v_admin_email;

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user % not found in auth.users. Please sign up first.', v_admin_email;
  END IF;
  RAISE NOTICE '   ✓ Found admin: % (ID: %)', v_admin_email, v_admin_user_id;

  -- Find customer user
  SELECT id INTO v_customer_user_id
  FROM auth.users
  WHERE email = v_customer_email;

  IF v_customer_user_id IS NULL THEN
    RAISE NOTICE '   ⚠ Customer user % not found in auth.users', v_customer_email;
    RAISE NOTICE '   ⚠ Will skip customer setup';
  ELSE
    RAISE NOTICE '   ✓ Found customer: % (ID: %)', v_customer_email, v_customer_user_id;
  END IF;

  -- ============================================
  -- STEP 2: Get or create organization
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
  -- STEP 3: Setup ADMIN
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👑 Setting up ADMIN: %', v_admin_email;

  -- Create or update profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    organization_id
  ) VALUES (
    v_admin_user_id,
    v_admin_email,
    'amangupta',
    v_org_id
  ) ON CONFLICT (id) DO UPDATE SET
    email = v_admin_email,
    full_name = 'amangupta',
    organization_id = v_org_id,
    updated_at = NOW();

  RAISE NOTICE '   ✓ Profile created';

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

  -- Clear and set permissions
  DELETE FROM user_module_permissions WHERE user_id = v_admin_user_id;

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

  RAISE NOTICE '   ✓ Permissions: 12/12 modules';
  RAISE NOTICE '   ✓ Admin Portal: ✅ YES';

  -- ============================================
  -- STEP 4: Setup CUSTOMER (if exists)
  -- ============================================
  
  IF v_customer_user_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '👤 Setting up CUSTOMER: %', v_customer_email;

    -- Create or update profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      organization_id
    ) VALUES (
      v_customer_user_id,
      v_customer_email,
      'Customer User',
      v_org_id
    ) ON CONFLICT (id) DO UPDATE SET
      email = v_customer_email,
      organization_id = v_org_id,
      updated_at = NOW();

    RAISE NOTICE '   ✓ Profile created';

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

    -- Clear and set permissions
    DELETE FROM user_module_permissions WHERE user_id = v_customer_user_id;

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

    RAISE NOTICE '   ✓ Permissions: 11/12 modules';
    RAISE NOTICE '   ✓ Admin Portal: ❌ NO';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all auth users
SELECT 
  '🔐 AUTH USERS' as section,
  id,
  email,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users
WHERE email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY email;

-- Show profiles
SELECT 
  '👥 PROFILES' as section,
  p.id,
  p.email,
  p.full_name,
  o.name as organization
FROM profiles p
LEFT JOIN organizations o ON o.id = p.organization_id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY p.email;

-- Show roles
SELECT 
  '🏢 ROLES' as section,
  p.email,
  om.role,
  CASE 
    WHEN om.role IN ('owner', 'manager') THEN '✅ Admin Portal'
    ELSE '❌ No Admin Portal'
  END as access
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY om.role DESC;

-- Show permissions
SELECT 
  '🔑 PERMISSIONS' as section,
  p.email,
  COUNT(*) as modules,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled
FROM profiles p
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
GROUP BY p.email
ORDER BY p.email;
