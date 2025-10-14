-- =====================================================
-- SYSTEM ADMINS TABLE
-- =====================================================
-- This table stores super admins who can manage the entire system
-- They have access to all organizations and can manage everything

CREATE TABLE IF NOT EXISTS system_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    permissions JSONB DEFAULT '{"full_access": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_admins_user_id ON system_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_system_admins_is_active ON system_admins(is_active);

-- Disable RLS on system_admins table (admins need to access this)
ALTER TABLE system_admins DISABLE ROW LEVEL SECURITY;

-- Insert your current admin user as system admin
-- Replace 'your-email@example.com' with your actual email
INSERT INTO system_admins (user_id, notes, created_at)
SELECT 
    p.id,
    'System administrator with full access',
    NOW()
FROM profiles p
WHERE p.email = 'amangu89@gmail.com'  -- Change this to your email
ON CONFLICT (user_id) DO NOTHING;

-- Verify system admins
SELECT 
    sa.id,
    sa.user_id,
    p.email,
    p.full_name,
    sa.is_active,
    sa.created_at
FROM system_admins sa
JOIN profiles p ON sa.user_id = p.id
WHERE sa.is_active = true;
