-- ============================================
-- DISABLE RLS ON organization_members
-- ============================================
-- This table needs to be readable for role checking
-- Without RLS blocking, to avoid infinite recursion
-- ============================================

-- Drop all policies
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
DROP POLICY IF EXISTS "Allow authenticated users to read memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

-- Disable RLS entirely on this table
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
  '✅ RLS Disabled on organization_members' as status,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'organization_members';
