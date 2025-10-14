-- Add predefined roles to user_roles table
-- Level 1: Admin (System Administrator)
-- Level 2: Customer (Organization User)

-- First, check if organization_id was successfully removed
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_roles' AND column_name = 'organization_id';

-- If organization_id still exists, we need to provide a value
-- Let's check if we need to handle it differently

-- Insert Admin role (Level 1 - System Admin interface)
INSERT INTO user_roles (
    id,
    role_name,
    role_description,
    is_admin,
    is_default,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Admin',
    'System Administrator - Full access to all organizations and settings (Level 1)',
    true,
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert Customer role (Level 2 - Organization user interface)
INSERT INTO user_roles (
    id,
    role_name,
    role_description,
    is_admin,
    is_default,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Customer',
    'Organization User - Access to organization features (Level 2)',
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Verify the roles were added
SELECT 
    '✅ Roles Added' as status,
    role_name,
    role_description,
    is_admin,
    is_default,
    created_at
FROM user_roles
WHERE role_name IN ('Admin', 'Customer')
ORDER BY is_admin DESC;
