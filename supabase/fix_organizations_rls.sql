-- ============================================
-- FIX ORGANIZATIONS TABLE RLS POLICIES
-- ============================================
-- Allow authenticated users to create organizations
-- and view organizations they are members of
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization members to view" ON organizations;
DROP POLICY IF EXISTS "Allow organization admins to manage" ON organizations;

-- Create new policies

-- Policy 1: Allow ANY authenticated user to INSERT organizations
-- (When they create their first organization)
CREATE POLICY "Allow authenticated users to create organizations" ON organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow users to view organizations they are members of
CREATE POLICY "Users can view their organizations" ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
  OR
  -- System admins can view all organizations
  auth.uid() IN (
    SELECT user_id 
    FROM system_admins 
    WHERE is_active = true
  )
);

-- Policy 3: Allow organization owners/managers to update their organization
CREATE POLICY "Organization admins can update" ON organizations
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
  OR
  -- System admins can update any organization
  auth.uid() IN (
    SELECT user_id 
    FROM system_admins 
    WHERE is_active = true
  )
);

-- Policy 4: Allow system admins to delete organizations
CREATE POLICY "System admins can delete organizations" ON organizations
FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM system_admins 
    WHERE is_active = true
  )
);

-- Verify policies
SELECT 
  '✅ Organizations RLS Policies Updated' as status,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;
