-- ============================================
-- UPDATE PROFILE ROLES
-- ============================================
-- Fix role_id for all existing profiles
-- ============================================

-- Step 1: Check if user_roles has Admin and Customer roles
SELECT 
  'Current Roles in user_roles table:' as info,
  id,
  role_name,
  role_description
FROM user_roles
WHERE role_name IN ('Admin', 'Customer')
ORDER BY role_name;

-- Step 2: Update all regular user profiles with Customer role_id
UPDATE profiles
SET 
  role_id = (SELECT id FROM user_roles WHERE role_name = 'Customer' LIMIT 1),
  updated_at = NOW()
WHERE role_id IS NULL
AND id NOT IN (
  -- Exclude system admins
  SELECT user_id FROM system_admins WHERE is_active = true
);

-- Step 3: Update system admin profiles with Admin role_id
UPDATE profiles
SET 
  role_id = (SELECT id FROM user_roles WHERE role_name = 'Admin' LIMIT 1),
  updated_at = NOW()
WHERE id IN (
  SELECT user_id FROM system_admins WHERE is_active = true
);

-- Step 4: Verify the updates
SELECT 
  '✅ Profiles Updated with Roles' as status;

SELECT 
  p.id,
  p.email,
  p.full_name,
  ur.role_name as assigned_role,
  CASE 
    WHEN sa.user_id IS NOT NULL THEN 'System Admin (Level 1)'
    ELSE 'Customer (Level 2)'
  END as access_level,
  p.updated_at
FROM profiles p
LEFT JOIN user_roles ur ON p.role_id = ur.id
LEFT JOIN system_admins sa ON p.id = sa.user_id AND sa.is_active = true
ORDER BY p.created_at DESC;
