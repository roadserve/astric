-- Add 'customer' role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer';

-- Verify the enum values
SELECT unnest(enum_range(NULL::user_role)) as role_values;
