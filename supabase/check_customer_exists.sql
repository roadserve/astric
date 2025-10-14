-- Check if customer@aisme.com exists
SELECT 
  'Checking for customer@aisme.com' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'customer@aisme.com') 
    THEN '✅ Customer account EXISTS'
    ELSE '❌ Customer account NOT FOUND - Please create it first'
  END as result;

-- If exists, show details
SELECT 
  'Customer Details' as section,
  p.id,
  p.email,
  p.full_name,
  p.created_at
FROM profiles p
WHERE p.email = 'customer@aisme.com';

-- Check if customer is in any organization
SELECT 
  'Customer Organization' as section,
  om.organization_id,
  om.role,
  om.is_active,
  o.name as organization_name
FROM profiles p
LEFT JOIN organization_members om ON om.user_id = p.id
LEFT JOIN organizations o ON o.id = om.organization_id
WHERE p.email = 'customer@aisme.com';
