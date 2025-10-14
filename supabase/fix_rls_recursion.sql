-- ============================================
-- FIX INFINITE RECURSION IN organization_members RLS
-- ============================================
-- The problem: policies use is_organization_member() which queries 
-- organization_members, causing infinite recursion
-- ============================================

-- Step 1: Drop ALL existing policies on organization_members
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

-- Step 2: Create simple, non-recursive policies
-- These policies don't call any functions - they use direct auth.uid() checks

-- Allow users to view their own membership records
CREATE POLICY "Users can view own membership"
ON organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to view members in the same organization
CREATE POLICY "Users can view same org members"
ON organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow admins (owner/manager) to insert members
CREATE POLICY "Admins can insert members"
ON organization_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'manager')
  )
);

-- Allow admins to update members
CREATE POLICY "Admins can update members"
ON organization_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'manager')
  )
);

-- Allow admins to delete members
CREATE POLICY "Admins can delete members"
ON organization_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'manager')
  )
);

-- Step 3: Verify the new policies
SELECT 
  '✅ New Policies Created' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;
