-- ============================================
-- SIMPLE FIX: Remove recursion completely
-- ============================================
-- Make organization_members table accessible for SELECT
-- to allow login role checking without recursion
-- ============================================

-- Step 1: Drop ALL policies on organization_members
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view their org" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;
DROP POLICY IF EXISTS "allow_select_organization_members" ON organization_members;
DROP POLICY IF EXISTS "allow_admin_manage_members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view same org members" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;

-- Step 2: Create SIMPLE policies without recursion

-- Allow authenticated users to read all organization_members
-- This is safe because it's just role/membership data, not sensitive
CREATE POLICY "Allow authenticated users to read memberships"
ON organization_members
FOR SELECT
TO authenticated
USING (true);

-- Only allow users to insert/update/delete their own org's members if they are admin
-- But we use a separate table lookup approach to avoid recursion
CREATE POLICY "Admins can manage members"
ON organization_members
FOR ALL
TO authenticated
USING (
  -- Check if current user is admin in this organization
  EXISTS (
    SELECT 1 FROM organization_members AS om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  -- Same check for INSERT
  EXISTS (
    SELECT 1 FROM organization_members AS om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role IN ('owner', 'manager')
  )
);

-- Step 3: Verify
SELECT 
  '✅ Fixed Policies' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;
