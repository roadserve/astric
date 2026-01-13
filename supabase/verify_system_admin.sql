-- Verify that aman is still in system_admins table
SELECT 
    sa.id,
    sa.user_id,
    p.email,
    p.full_name,
    sa.is_active,
    sa.created_at
FROM system_admins sa
JOIN profiles p ON sa.user_id = p.id
WHERE p.email = 'amangu89@gmail.com';

-- Also check if the user exists in profiles
SELECT 
    id,
    email,
    full_name,
    created_at
FROM profiles
WHERE email = 'amangu89@gmail.com';
