-- Add 'customer' role to user_role enum
-- Note: Run this statement ALONE first, then run the verification in a separate query

ALTER TYPE user_role ADD VALUE 'customer';

-- AFTER the above completes successfully, run this in a SEPARATE query to verify:
-- SELECT unnest(enum_range(NULL::user_role)) as role_values;
