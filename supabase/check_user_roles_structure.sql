-- Check the actual structure of user_roles table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Show a sample of data if any exists
SELECT * FROM user_roles LIMIT 5;
