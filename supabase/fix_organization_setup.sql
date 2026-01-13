-- Fix Organization Setup for Existing Users
-- This script creates organizations for users who don't have one

-- Step 1: Create a function to setup organization for a user
CREATE OR REPLACE FUNCTION setup_user_organization(user_id UUID, org_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Get user details
    SELECT email, full_name INTO user_email, user_name
    FROM profiles
    WHERE id = user_id;
    
    -- Create organization
    INSERT INTO organizations (name, email, subscription_tier, subscription_status)
    VALUES (
        COALESCE(org_name, user_name || '''s Organization', 'My Organization'),
        user_email,
        'free',
        'active'
    )
    RETURNING id INTO new_org_id;
    
    -- Add user as organization owner
    INSERT INTO organization_members (organization_id, user_id, role, is_active)
    VALUES (new_org_id, user_id, 'owner', true);
    
    -- Update profile with organization_id
    UPDATE profiles
    SET organization_id = new_org_id
    WHERE id = user_id;
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Add organization_id column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
    END IF;
END $$;

-- Step 3: Fix the handle_new_user function to create organization automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    
    -- Create organization for new user
    INSERT INTO organizations (name, email, subscription_tier, subscription_status)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)) || '''s Organization',
        NEW.email,
        'free',
        'active'
    )
    RETURNING id INTO new_org_id;
    
    -- Add user as organization owner
    INSERT INTO organization_members (organization_id, user_id, role, is_active)
    VALUES (new_org_id, NEW.id, 'owner', true);
    
    -- Update profile with organization_id
    UPDATE profiles
    SET organization_id = new_org_id
    WHERE id = NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile/organization for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Setup organizations for existing users who don't have one
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT p.id, p.email, p.full_name
        FROM profiles p
        LEFT JOIN organization_members om ON p.id = om.user_id
        WHERE om.id IS NULL
    LOOP
        PERFORM setup_user_organization(user_record.id, user_record.full_name || '''s Organization');
        RAISE NOTICE 'Created organization for user: %', user_record.email;
    END LOOP;
END $$;

-- Step 5: Update RLS policies to allow organization access
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
CREATE POLICY "Users can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
