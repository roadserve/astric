-- Fix RLS policies for organization_members table
-- The error "column reference user_id is ambiguous" means the policy has a conflict

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view their org" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of their organization" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Create clear, unambiguous policies
CREATE POLICY "Users can view organization members"
ON organization_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.organization_id = organization_members.organization_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization admins can insert members"
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

CREATE POLICY "Organization admins can update members"
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

CREATE POLICY "Organization admins can delete members"
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

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;







