-- ============================================
-- RBAC SYSTEM VERIFICATION SCRIPT
-- Run this to verify everything is working
-- ============================================

-- 1. Check if all RBAC tables exist
SELECT 
  'Tables Check' as check_name,
  COUNT(*) as found,
  7 as expected,
  CASE WHEN COUNT(*) = 7 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_roles',
  'user_module_permissions',
  'role_module_permissions',
  'user_activity_log',
  'user_sessions',
  'system_settings',
  'user_invitations'
);

-- 2. Check if system_module enum has all 12 modules
SELECT 
  'Modules Enum Check' as check_name,
  COUNT(*) as found,
  12 as expected,
  CASE WHEN COUNT(*) = 12 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_enum
WHERE enumtypid = 'system_module'::regtype;

-- 3. Check if permission_level enum has all 4 levels
SELECT 
  'Permission Levels Check' as check_name,
  COUNT(*) as found,
  4 as expected,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_enum
WHERE enumtypid = 'permission_level'::regtype;

-- 4. Check if helper functions exist
SELECT 
  'Helper Functions Check' as check_name,
  COUNT(*) as found,
  3 as expected,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'check_user_module_permission',
  'get_user_accessible_modules',
  'log_user_activity'
);

-- 5. List all available modules
SELECT 
  '📋 Available Modules' as info,
  enumlabel as module_name
FROM pg_enum
WHERE enumtypid = 'system_module'::regtype
ORDER BY enumsortorder;

-- 6. List all permission levels
SELECT 
  '🔐 Permission Levels' as info,
  enumlabel as level_name
FROM pg_enum
WHERE enumtypid = 'permission_level'::regtype
ORDER BY enumsortorder;

-- 7. Check RLS policies on key tables
SELECT 
  '🛡️ RLS Policies' as info,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'user_module_permissions',
  'organization_members',
  'profiles'
)
GROUP BY tablename
ORDER BY tablename;

-- 8. Check current user's organization membership
SELECT 
  '👤 Current User Info' as info,
  p.email,
  p.full_name,
  om.role,
  om.is_active,
  o.name as organization_name
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE p.id = auth.uid();

-- 9. Check current user's permissions (if any)
SELECT 
  '🔑 Current User Permissions' as info,
  module,
  permission_level,
  is_enabled,
  granted_at
FROM user_module_permissions
WHERE user_id = auth.uid()
ORDER BY module;

-- 10. Count users in organization
SELECT 
  '👥 Organization Users' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive_users
FROM organization_members
WHERE organization_id = (
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
);

-- 11. Check if indexes are created
SELECT 
  '📊 Indexes' as info,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%user_module_permissions%'
   OR indexname LIKE '%user_activity_log%'
ORDER BY tablename, indexname;

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '📊 SUMMARY' as section,
  '✅ All checks should show PASS' as note,
  '✅ Modules should be 12' as note2,
  '✅ Permission levels should be 4' as note3,
  '✅ Helper functions should be 3' as note4;
