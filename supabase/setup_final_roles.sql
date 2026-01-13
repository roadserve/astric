-- ============================================
-- FINAL ROLE SETUP
-- ============================================
-- Admin: amangu89@gmail.com (Full Access + Admin Portal)
-- Customer: customer@aisme.com (Full Access EXCEPT Admin Portal)
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid := '1fc8dadc-a8e1-4722-85ce-32acad6f4060'; -- amangu89@gmail.com
  v_customer_user_id uuid := 'c91b93c0-8d7d-4959-962e-b743fb3438f3'; -- customer@aisme.com
  v_admin_org_id uuid;
  v_customer_org_id uuid;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up Admin and Customer Roles';
  RAISE NOTICE '========================================';

  -- ============================================
  -- STEP 1: Setup ADMIN (amangu89@gmail.com)
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👑 Setting up ADMIN: amangu89@gmail.com';
  
  -- Get admin organization
  SELECT organization_id INTO v_admin_org_id
  FROM organization_members
  WHERE user_id = v_admin_user_id
  LIMIT 1;

  IF v_admin_org_id IS NULL THEN
    RAISE EXCEPTION 'Admin user is not in any organization';
  END IF;

  RAISE NOTICE '   ✓ Organization ID: %', v_admin_org_id;

  -- Set role to OWNER
  UPDATE organization_members
  SET role = 'owner',
      is_active = true
  WHERE user_id = v_admin_user_id
  AND organization_id = v_admin_org_id;

  RAISE NOTICE '   ✓ Role set to: OWNER';

  -- Delete existing permissions
  DELETE FROM user_module_permissions
  WHERE user_id = v_admin_user_id
  AND organization_id = v_admin_org_id;

  -- Grant FULL permissions to ALL 12 modules
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

  RAISE NOTICE '   ✓ Granted FULL access to ALL 12 modules';
  RAISE NOTICE '   ✓ Admin Portal: ✅ YES';
  RAISE NOTICE '   ✅ ADMIN SETUP COMPLETE';

  -- ============================================
  -- STEP 2: Setup CUSTOMER (customer@aisme.com)
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👤 Setting up CUSTOMER: customer@aisme.com';

  -- Get customer organization (use same as admin for now)
  SELECT organization_id INTO v_customer_org_id
  FROM organization_members
  WHERE user_id = v_customer_user_id
  LIMIT 1;

  -- If customer not in organization, add them to admin's org
  IF v_customer_org_id IS NULL THEN
    RAISE NOTICE '   ⚠ Customer not in organization, adding to admin org';
    v_customer_org_id := v_admin_org_id;
    
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
    SET role = 'staff',
        is_active = true;
  ELSE
    -- Update existing membership
    UPDATE organization_members
    SET role = 'staff',
        is_active = true
    WHERE user_id = v_customer_user_id
    AND organization_id = v_customer_org_id;
  END IF;

  RAISE NOTICE '   ✓ Organization ID: %', v_customer_org_id;
  RAISE NOTICE '   ✓ Role set to: STAFF (Customer)';

  -- Delete existing permissions
  DELETE FROM user_module_permissions
  WHERE user_id = v_customer_user_id
  AND organization_id = v_customer_org_id;

  -- Grant FULL permissions to 11 modules (ALL EXCEPT Admin Portal)
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

  RAISE NOTICE '   ✓ Granted FULL access to 11 modules';
  RAISE NOTICE '   ✓ Admin Portal: ❌ NO (Blocked)';
  RAISE NOTICE '   ✅ CUSTOMER SETUP COMPLETE';

  -- ============================================
  -- SUMMARY
  -- ============================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👑 ADMIN:';
  RAISE NOTICE '   Email: amangu89@gmail.com';
  RAISE NOTICE '   Display Name: amangupta';
  RAISE NOTICE '   Role: OWNER';
  RAISE NOTICE '   Modules: 12/12 (Full Access)';
  RAISE NOTICE '   Admin Portal: ✅ YES';
  RAISE NOTICE '';
  RAISE NOTICE '👤 CUSTOMER:';
  RAISE NOTICE '   Email: customer@aisme.com';
  RAISE NOTICE '   Display Name: -';
  RAISE NOTICE '   Role: STAFF (Customer)';
  RAISE NOTICE '   Modules: 11/12 (Full Access)';
  RAISE NOTICE '   Admin Portal: ❌ NO';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show both users
SELECT 
  '👥 USER SUMMARY' as section,
  p.email,
  COALESCE(p.full_name, '-') as display_name,
  om.role,
  CASE 
    WHEN om.role = 'owner' THEN '👑 Admin'
    ELSE '👤 Customer'
  END as user_type,
  om.is_active as active
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY CASE om.role WHEN 'owner' THEN 1 ELSE 2 END;

-- Show admin permissions (12 modules)
SELECT 
  '👑 ADMIN PERMISSIONS' as section,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as enabled
FROM user_module_permissions ump
JOIN profiles p ON p.id = ump.user_id
WHERE p.email = 'amangu89@gmail.com'
ORDER BY ump.module;

-- Show customer permissions (11 modules)
SELECT 
  '👤 CUSTOMER PERMISSIONS' as section,
  ump.module,
  ump.permission_level,
  CASE WHEN ump.is_enabled THEN '✅' ELSE '❌' END as enabled
FROM user_module_permissions ump
JOIN profiles p ON p.id = ump.user_id
WHERE p.email = 'customer@aisme.com'
ORDER BY ump.module;

-- Access comparison
SELECT 
  '📊 ACCESS COMPARISON' as section,
  p.email,
  om.role,
  COUNT(ump.module) as total_modules,
  COUNT(CASE WHEN ump.is_enabled THEN 1 END) as enabled_modules,
  CASE 
    WHEN om.role = 'owner' THEN '✅ Can access Admin Portal'
    ELSE '❌ Cannot access Admin Portal'
  END as admin_portal
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
GROUP BY p.email, om.role
ORDER BY om.role DESC;
