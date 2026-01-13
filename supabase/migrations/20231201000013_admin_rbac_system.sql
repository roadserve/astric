-- Admin Portal & Role-Based Access Control System
-- This migration adds comprehensive user management and module-level permissions

-- Create enum for system modules
CREATE TYPE system_module AS ENUM (
  'dashboard',
  'billing',
  'payroll',
  'whatsapp_crm',
  'social_media',
  'gmb',
  'analytics',
  'customers',
  'products',
  'attendance',
  'ai_copilot',
  'settings'
);

-- Create enum for permission levels
CREATE TYPE permission_level AS ENUM (
  'none',
  'view',
  'edit',
  'full'
);

-- User Roles Table (Enhanced)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_description TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Module Permissions Table
CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module system_module NOT NULL,
  permission_level permission_level DEFAULT 'none',
  is_enabled BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id, module)
);

-- Role Module Permissions Table (Template for roles)
CREATE TABLE IF NOT EXISTS public.role_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.user_roles(id) ON DELETE CASCADE,
  module system_module NOT NULL,
  permission_level permission_level DEFAULT 'view',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, module)
);

-- User Activity Log
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  module system_module,
  entity_type TEXT,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- User Invitations Table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID REFERENCES public.user_roles(id),
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add role_id to organization_members if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' 
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.organization_members 
    ADD COLUMN role_id UUID REFERENCES public.user_roles(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id ON public.user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_org_id ON public.user_module_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_module ON public.user_module_permissions(module);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their organization"
ON public.user_roles FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    JOIN public.profiles p ON p.id = om.user_id
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

-- RLS Policies for user_module_permissions
CREATE POLICY "Users can view their own permissions"
ON public.user_module_permissions FOR SELECT
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

CREATE POLICY "Admins can manage user permissions"
ON public.user_module_permissions FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

-- RLS Policies for role_module_permissions
CREATE POLICY "Users can view role permissions in their org"
ON public.role_module_permissions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage role permissions"
ON public.role_module_permissions FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view their own activity"
ON public.user_activity_log FOR SELECT
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

CREATE POLICY "System can insert activity logs"
ON public.user_activity_log FOR INSERT
WITH CHECK (true);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

CREATE POLICY "Users can manage their own sessions"
ON public.user_sessions FOR ALL
USING (user_id = auth.uid());

-- RLS Policies for system_settings
CREATE POLICY "Users can view public settings"
ON public.system_settings FOR SELECT
USING (
  is_public = true OR
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage settings"
ON public.system_settings FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

-- RLS Policies for user_invitations
CREATE POLICY "Users can view invitations in their org"
ON public.user_invitations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage invitations"
ON public.user_invitations FOR ALL
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_members om
    WHERE om.user_id = auth.uid() 
    AND (om.role = 'owner' OR om.role = 'manager')
  )
);

-- Function to check user module permission
CREATE OR REPLACE FUNCTION public.check_user_module_permission(
  p_user_id UUID,
  p_module system_module,
  p_required_level permission_level DEFAULT 'view'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permission permission_level;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT (om.role = 'owner' OR om.role = 'manager')
  INTO v_is_admin
  FROM public.organization_members om
  WHERE om.user_id = p_user_id
  LIMIT 1;
  
  -- Admins have full access
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check user's specific module permission
  SELECT permission_level
  INTO v_permission
  FROM public.user_module_permissions
  WHERE user_id = p_user_id
    AND module = p_module
    AND is_enabled = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;
  
  -- If no permission found, deny access
  IF v_permission IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has required permission level
  CASE p_required_level
    WHEN 'none' THEN RETURN TRUE;
    WHEN 'view' THEN RETURN v_permission IN ('view', 'edit', 'full');
    WHEN 'edit' THEN RETURN v_permission IN ('edit', 'full');
    WHEN 'full' THEN RETURN v_permission = 'full';
    ELSE RETURN FALSE;
  END CASE;
END;
$$;

-- Function to get user's accessible modules
CREATE OR REPLACE FUNCTION public.get_user_accessible_modules(p_user_id UUID)
RETURNS TABLE (
  module system_module,
  permission_level permission_level,
  is_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT (om.role = 'owner' OR om.role = 'manager')
  INTO v_is_admin
  FROM public.organization_members om
  WHERE om.user_id = p_user_id
  LIMIT 1;
  
  -- If admin, return all modules with full access
  IF v_is_admin THEN
    RETURN QUERY
    SELECT 
      unnest(ARRAY[
        'dashboard', 'billing', 'payroll', 'whatsapp_crm', 
        'social_media', 'gmb', 'analytics', 'customers', 
        'products', 'attendance', 'ai_copilot', 'settings'
      ]::system_module[]) AS module,
      'full'::permission_level AS permission_level,
      true AS is_enabled;
  ELSE
    -- Return user's specific permissions
    RETURN QUERY
    SELECT 
      ump.module,
      ump.permission_level,
      ump.is_enabled
    FROM public.user_module_permissions ump
    WHERE ump.user_id = p_user_id
      AND ump.is_enabled = true
      AND (ump.expires_at IS NULL OR ump.expires_at > NOW());
  END IF;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_module system_module DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_org_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Insert activity log
  INSERT INTO public.user_activity_log (
    organization_id,
    user_id,
    action,
    module,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    v_org_id,
    p_user_id,
    p_action,
    p_module,
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_module_permissions_updated_at
  BEFORE UPDATE ON public.user_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_role_module_permissions_updated_at
  BEFORE UPDATE ON public.role_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default roles for existing organizations
INSERT INTO public.user_roles (organization_id, role_name, role_description, is_admin, is_default)
SELECT 
  id,
  'Admin',
  'Full access to all modules and settings',
  true,
  false
FROM public.organizations
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (organization_id, role_name, role_description, is_admin, is_default)
SELECT 
  id,
  'User',
  'Standard user with limited access',
  false,
  true
FROM public.organizations
ON CONFLICT DO NOTHING;

-- Grant all permissions to existing admin users (owner and manager)
INSERT INTO public.user_module_permissions (
  organization_id,
  user_id,
  module,
  permission_level,
  is_enabled
)
SELECT 
  om.organization_id,
  om.user_id,
  unnest(ARRAY[
    'dashboard', 'billing', 'payroll', 'whatsapp_crm', 
    'social_media', 'gmb', 'analytics', 'customers', 
    'products', 'attendance', 'ai_copilot', 'settings'
  ]::system_module[]),
  'full'::permission_level,
  true
FROM public.organization_members om
WHERE om.role IN ('owner', 'manager')
ON CONFLICT (organization_id, user_id, module) DO NOTHING;

COMMENT ON TABLE public.user_roles IS 'Defines roles within an organization';
COMMENT ON TABLE public.user_module_permissions IS 'Stores user-specific module access permissions';
COMMENT ON TABLE public.role_module_permissions IS 'Stores role-based module access templates';
COMMENT ON TABLE public.user_activity_log IS 'Logs all user actions for audit trail';
COMMENT ON TABLE public.user_sessions IS 'Tracks active user sessions';
COMMENT ON TABLE public.system_settings IS 'Stores organization-wide system settings';
COMMENT ON TABLE public.user_invitations IS 'Manages user invitation workflow';
