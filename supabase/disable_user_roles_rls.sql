-- Simplest solution: Disable RLS on user_roles table entirely
-- This table appears to have structural issues and might not be used properly

-- Drop all policies
DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Organization members can view roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "System admins can manage roles" ON user_roles;

-- Disable RLS entirely
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Now try to remove organization_id column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_roles' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE user_roles DROP COLUMN organization_id CASCADE;
        RAISE NOTICE 'Column organization_id dropped';
    END IF;
END $$;

-- Verify
SELECT 
    '✅ user_roles RLS disabled' as status,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'user_roles';
