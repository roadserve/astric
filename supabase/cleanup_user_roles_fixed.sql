-- Drop RLS policies that depend on organization_id, then remove the column
-- Since roles are managed through organization_members, user_roles table doesn't need organization_id

-- Step 1: Drop dependent policies
DROP POLICY IF EXISTS "Users can view roles in their organization" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Organization members can view roles" ON user_roles;

-- Step 2: Drop the organization_id column
ALTER TABLE user_roles DROP COLUMN IF EXISTS organization_id;

-- Step 3: Create simpler policies if the table still needs RLS
-- (If user_roles is even used - it might be obsolete since we use organization_members for roles)

-- Allow authenticated users to view their own roles
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow system admins to manage all roles
CREATE POLICY "System admins can manage roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM system_admins
    WHERE user_id = auth.uid()
    AND is_active = true
  )
);

-- Step 4: Verify the structure
SELECT 
    '✅ user_roles table structure' as status,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;
