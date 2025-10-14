-- Verify the setup is correct

-- Check organization roles (THIS IS WHAT MATTERS FOR ADMIN PORTAL)
SELECT 
  '🏢 ORGANIZATION ROLES (Controls Admin Portal)' as section,
  p.email,
  om.role,
  om.is_active,
  CASE 
    WHEN om.role IN ('owner', 'manager') THEN '✅ CAN access Admin Portal'
    ELSE '❌ CANNOT access Admin Portal'
  END as admin_portal_access
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
ORDER BY om.role DESC;

-- Check if customer has settings module (should have it)
SELECT 
  '🔍 Customer Module Check' as section,
  p.email,
  ump.module,
  ump.permission_level,
  ump.is_enabled
FROM profiles p
JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email = 'customer@aisme.com'
ORDER BY ump.module;

-- Count modules for each user
SELECT 
  '📊 Module Count' as section,
  p.email,
  om.role,
  COUNT(ump.module) as total_modules,
  CASE 
    WHEN om.role IN ('owner', 'manager') THEN 'Should have 12 modules'
    ELSE 'Should have 12 modules (but no admin portal access due to role)'
  END as expected
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
LEFT JOIN user_module_permissions ump ON ump.user_id = p.id
WHERE p.email IN ('amangu89@gmail.com', 'customer@aisme.com')
GROUP BY p.email, om.role
ORDER BY om.role DESC;
