-- Complete fix for organization creation (406 errors)
-- This allows authenticated users to create organizations and become owners

-- ============================================
-- 1. FIX ORGANIZATIONS TABLE
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization admins can update" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

-- Create new permissive policies
CREATE POLICY "Authenticated users can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (true);  -- Any authenticated user can create an organization

CREATE POLICY "Users can view organizations they belong to"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM system_admins
    WHERE system_admins.user_id = auth.uid()
    AND system_admins.is_active = true
  )
);

CREATE POLICY "Organization owners can update"
ON organizations FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

-- ============================================
-- 2. FIX ORGANIZATION_MEMBERS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "allow_select_organization_members" ON organization_members;

-- Create new policies
CREATE POLICY "Users can insert themselves as organization owner"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()  -- Can only add themselves
  AND role = 'owner'     -- As owner
);

CREATE POLICY "Organization admins can add members"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Users can view members in their organizations"
ON organization_members FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM system_admins
    WHERE system_admins.user_id = auth.uid()
    AND system_admins.is_active = true
  )
);

CREATE POLICY "Organization admins can update members"
ON organization_members FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Organization admins can delete members"
ON organization_members FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
  AND user_id != auth.uid()  -- Can't delete themselves
);

-- ============================================
-- 3. SERVICE ROLE ACCESS (for backend)
-- ============================================

CREATE POLICY "Service role full access to organizations"
ON organizations FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role full access to organization_members"
ON organization_members FOR ALL
TO service_role
USING (true);

-- ============================================
-- 4. VERIFY POLICIES ARE WORKING
-- ============================================

-- Check if RLS is enabled (should be true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'organization_members');

-- Count policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'organization_members')
ORDER BY tablename, policyname;

