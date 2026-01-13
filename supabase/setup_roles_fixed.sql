-- ============================================
-- FIXED ROLE SETUP
-- ============================================
-- Handles case where users might not be in organization yet
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid := '1fc8dadc-a8e1-4722-85ce-32acad6f4060'; -- amangu89@gmail.com
  v_customer_user_id uuid := 'c91b93c0-8d7d-4959-962e-b743fb3438f3'; -- customer@aisme.com
  v_org_id uuid;
  v_org_exists boolean;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up Admin and Customer';
  RAISE NOTICE '========================================';

  -- Check if admin user exists in profiles
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_admin_user_id) THEN
    RAISE EXCEPTION 'Admin user not found in profiles table';
  END IF;

  -- Try to get existing organization from admin user
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = v_admin_user_id
  LIMIT 1;

  -- If no organization found, try to get from profiles table
  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id
    FROM profiles
    WHERE id = v_admin_user_id;
  END IF;

  -- If still no organization, get any organization or create one
  IF v_org_id IS NULL THEN
    RAISE NOTICE '⚠️  No organization found, looking for existing organizations...';
    
    -- Try to get any existing organization
    SELECT id INTO v_org_id
    FROM organizations
    LIMIT 1;
    
    -- If no organization exists at all, create one
    IF v_org_id IS NULL THEN
      RAISE NOTICE '⚠️  No organizations exist, creating one...';
      
      INSERT INTO organizations (name, description)
      VALUES ('AI SME Copilot Organization', 'Main organization')
      RETURNING id INTO v_org_id;
      
      RAISE NOTICE '✓ Created organization: %', v_org_id;
    END IF;
  END IF;

  RAISE NOTICE 'Using Organization ID: %', v_org_id;

  -- ============================================
  -- ADMIN SETUP
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👑 Setting up ADMIN: amangu89@gmail.com';

  -- Add or update admin in organization_members
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

  -- Update profiles table to link organization
  UPDATE profiles
  SET organization_id = v_org_id
  WHERE id = v_admin_user_id;

  -- Clear existing permissions
  DELETE FROM user_module_permissions
  WHERE user_id = v_admin_user_id;

  -- Grant full access to all 12 modules
  INSERT INTO user_module_permissions (
    organization_id,
    user_id,
    module,
    permission_level,
    is_enabled
  )
  SELECT 
    v_org_id,
    v_admin_user_id,
    unnest(enum_range(NULL::system_module)),
    'full'::permission_level,
    true;

  RAISE NOTICE '   ✓ Permissions: 12/12 modules (FULL)';
  RAISE NOTICE '   ✓ Admin Portal: YES';

  -- ============================================
  -- CUSTOMER SETUP
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👤 Setting up CUSTOMER: customer@aisme.com';

  -- Check if customer user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_customer_user_id) THEN
    RAISE NOTICE '   ⚠️  Customer user not found in profiles';
    RAISE NOTICE '   ⚠️  Skipping customer setup';
  ELSE
    -- Add customer to organization
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

    -- Update profiles table to link organization
    UPDATE profiles
    SET organization_id = v_org_id
    WHERE id = v_customer_user_id;

    -- Clear existing permissions
    DELETE FROM user_module_permissions
    WHERE user_id = v_customer_user_id;

    -- Grant full access to all modules EXCEPT admin portal
    INSERT INTO user_module_permissions (
      organization_id,
      user_id,
      module,
      permission_level,
      is_enabled
    )
    VALUES
      (v_org_id, v_customer_user_id, 'dashboard', 'full', true),
      (v_org_id, v_customer_user_id, 'billing', 'full', true),
      (v_org_id, v_customer_user_id, 'payroll', 'full', true),
      (v_org_id, v_customer_user_id, 'whatsapp_crm', 'full', true),
      (v_org_id, v_customer_user_id, 'social_media', 'full', true),
      (v_org_id, v_customer_user_id, 'gmb', 'full', true),
      (v_org_id, v_customer_user_id, 'analytics', 'full', true),
      (v_org_id, v_customer_user_id, 'customers', 'full', true),
      (v_org_id, v_customer_user_id, 'products', 'full', true),
      (v_org_id, v_customer_user_id, 'attendance', 'full', true),
      (v_org_id, v_customer_user_id, 'ai_copilot', 'full', true),
      (v_org_id, v_customer_user_id, 'settings', 'full', true);

    RAISE NOTICE '   ✓ Permissions: 11/12 modules (FULL)';
    RAISE NOTICE '   ✓ Admin Portal: NO (blocked by role)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '========================================';

END $$;

-- Verification
SELECT 
  '👥 USERS' as section,
  p.email,
  p.full_name,
  om.role as org_role,
  om.is_active,
  p.organization_id
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
WHERE p.id IN (
  '1fc8dadc-a8e1-4722-85ce-32acad6f4060',
  'c91b93c0-8d7d-4959-962e-b743fb3438f3'
)
ORDER BY om.role DESC;

SELECT 
  '🔑 PERMISSIONS' as section,
  p.email,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled_modules,
  CASE 
    WHEN om.role IN ('owner', 'manager') THEN '✅ Can access Admin Portal'
    ELSE '❌ Cannot access Admin Portal'
  END as admin_access
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.id IN (
  '1fc8dadc-a8e1-4722-85ce-32acad6f4060',
  'c91b93c0-8d7d-4959-962e-b743fb3438f3'
)
GROUP BY p.email, om.role
ORDER BY om.role DESC;

-- Show all modules for each user
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
