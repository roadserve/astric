-- ============================================
-- SIMPLE ROLE SETUP
-- ============================================
-- Sets up admin and customer with correct permissions
-- ============================================

DO $$
DECLARE
  v_admin_user_id uuid := '1fc8dadc-a8e1-4722-85ce-32acad6f4060'; -- amangu89@gmail.com
  v_customer_user_id uuid := 'c91b93c0-8d7d-4959-962e-b743fb3438f3'; -- customer@aisme.com
  v_org_id uuid;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Setting up Admin and Customer';
  RAISE NOTICE '========================================';

  -- Get organization ID (assuming both users in same org)
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = v_admin_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found for admin user';
  END IF;

  RAISE NOTICE 'Organization ID: %', v_org_id;

  -- ============================================
  -- ADMIN SETUP
  -- ============================================
  
  RAISE NOTICE '';
  RAISE NOTICE '👑 Setting up ADMIN: amangu89@gmail.com';

  -- Update role in organization_members to 'owner'
  UPDATE organization_members
  SET role = 'owner'
  WHERE user_id = v_admin_user_id
  AND organization_id = v_org_id;

  RAISE NOTICE '   ✓ Role: owner';

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

  -- Ensure customer is in organization
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
  DELETE FROM user_module_permissions
  WHERE user_id = v_customer_user_id;

  -- Grant full access to all modules EXCEPT we won't add any
  -- The UI will check the role and hide admin portal
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

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '========================================';

END $$;

-- Verification
SELECT 
  '👥 USERS' as section,
  p.email,
  om.role as org_role,
  om.is_active
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
