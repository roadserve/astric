-- Add predefined roles to user_roles table
-- Level 1: Admin (System Administrator)
-- Level 2: Customer (Organization User)

-- Note: If organization_id column still exists, we'll use a null UUID placeholder
-- Since these are global role definitions, they don't belong to a specific org

DO $$
DECLARE
    has_org_id BOOLEAN;
    placeholder_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Check if organization_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_roles' AND column_name = 'organization_id'
    ) INTO has_org_id;

    IF has_org_id THEN
        -- Insert with organization_id (global placeholder)
        RAISE NOTICE 'organization_id exists, using placeholder';
        
        INSERT INTO user_roles (
            id,
            organization_id,
            role_name,
            role_description,
            is_admin,
            is_default,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            placeholder_org_id,
            'Admin',
            'System Administrator - Full access to all organizations and settings (Level 1)',
            true,
            false,
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;

        INSERT INTO user_roles (
            id,
            organization_id,
            role_name,
            role_description,
            is_admin,
            is_default,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            placeholder_org_id,
            'Customer',
            'Organization User - Access to organization features (Level 2)',
            false,
            true,
            NOW(),
            NOW()
        ) ON CONFLICT DO NOTHING;
    ELSE
        -- Insert without organization_id
        RAISE NOTICE 'organization_id does not exist';
        
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
    END IF;
END $$;

-- Verify the roles were added
SELECT 
    '✅ Roles Added' as status,
    role_name,
    role_description,
    is_admin,
    is_default
FROM user_roles
WHERE role_name IN ('Admin', 'Customer')
ORDER BY is_admin DESC;
