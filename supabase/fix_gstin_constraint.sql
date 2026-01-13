-- ============================================
-- FIX GSTIN UNIQUE CONSTRAINT
-- ============================================
-- Allow multiple NULL/empty GSTIN values
-- Only enforce uniqueness for non-null values
-- ============================================

-- Drop the existing unique constraint on GSTIN
ALTER TABLE organizations 
DROP CONSTRAINT IF EXISTS organizations_gstin_key;

-- Create a partial unique index that only enforces uniqueness for non-null GSTIN values
CREATE UNIQUE INDEX organizations_gstin_unique_idx 
ON organizations (gstin) 
WHERE gstin IS NOT NULL AND gstin != '';

-- Verify the fix
SELECT 
  '✅ GSTIN Constraint Fixed - Multiple Empty Values Allowed' as status;

-- Show current constraints and indexes
SELECT 
  indexname as index_name,
  indexdef as definition
FROM pg_indexes
WHERE tablename = 'organizations'
AND indexname LIKE '%gstin%';
