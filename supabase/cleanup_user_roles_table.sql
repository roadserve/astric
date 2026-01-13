-- Remove organization_id from user_roles table if it exists
-- This field is not needed as roles are managed through organization_members table

-- Check if the column exists first
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE user_roles DROP COLUMN organization_id;
        RAISE NOTICE 'Column organization_id dropped from user_roles table';
    ELSE
        RAISE NOTICE 'Column organization_id does not exist in user_roles table';
    END IF;
END $$;

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;
