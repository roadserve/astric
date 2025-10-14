-- Step 1: Check if system admin entry exists
SELECT 
    sa.id,
    sa.user_id,
    p.email,
    p.full_name,
    sa.is_active
FROM system_admins sa
JOIN profiles p ON sa.user_id = p.id
WHERE p.email = 'amangu89@gmail.com';

-- Step 2: If not found, re-insert
INSERT INTO system_admins (user_id, notes, is_active)
SELECT 
    id,
    'System administrator - Re-added after cleanup',
    true
FROM profiles
WHERE email = 'amangu89@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = true,
    notes = 'System administrator - Re-activated';

-- Step 3: Verify it's there now
SELECT 
    '✅ System Admin Status' as status,
    sa.id,
    p.email,
    p.full_name,
    sa.is_active,
    sa.created_at
FROM system_admins sa
JOIN profiles p ON sa.user_id = p.id
WHERE p.email = 'amangu89@gmail.com';
