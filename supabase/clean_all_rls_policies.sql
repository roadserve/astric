-- ============================================
-- CLEAN ALL RLS POLICIES FOR ORGANIZATION_MEMBERS
-- ============================================
-- Remove all existing policies and create clean ones
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Organization admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners can manage organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their organization members" ON organization_members;
DROP POLICY IF EXISTS "Organization members can view their org" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage organization members" ON organization_members;

-- Verify all policies are dropped
SELECT 
  '🗑️ Dropped Policies' as status,
  COUNT(*) as remaining_policies
FROM pg_policies
WHERE tablename = 'organization_members';

-- ============================================
-- CREATE CLEAN, SIMPLE POLICIES
-- ============================================

-- Policy 1: Anyone can view organization members (for now, to debug)
CREATE POLICY "allow_select_organization_members"
ON organization_members
FOR SELECT
TO public
USING (true);

-- Policy 2: Admins can manage members
CREATE POLICY "allow_admin_manage_members"
ON organization_members
FOR ALL
TO public
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM organization_members 
    WHERE organization_id = organization_members.organization_id
    AND role IN ('owner', 'manager')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id 
    FROM organization_members 
    WHERE organization_id = organization_members.organization_id
    AND role IN ('owner', 'manager')
  )
);

-- Verify new policies
SELECT 
  '✅ New Policies' as status,
  policyname,
  cmd as command
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS Policies Cleaned and Recreated';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policy 1: allow_select_organization_members';
  RAISE NOTICE '  - Allows SELECT for everyone (temporary for debugging)';
  RAISE NOTICE '';
  RAISE NOTICE 'Policy 2: allow_admin_manage_members';
  RAISE NOTICE '  - Allows ALL operations for owners/managers';
  RAISE NOTICE '';
  RAISE NOTICE 'Now refresh your browser and test!';
  RAISE NOTICE '========================================';
END $$;
