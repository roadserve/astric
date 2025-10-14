-- Check what users exist in auth.users
SELECT 
  'Auth Users' as section,
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
