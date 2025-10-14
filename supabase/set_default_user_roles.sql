-- Set default roles for all users (except the admin)
-- This will set all other users to 'staff' role with basic permissions

DO $$
DECLARE
  v_admin_user_id uuid;
  v_user record;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_user_id
  FROM profiles
  WHERE email = 'amangu89@gmail.com';

  RAISE NOTICE 'Admin user ID: %', v_admin_user_id;

  -- Update all other users to 'staff' role
  FOR v_user IN 
    SELECT om.user_id, om.organization_id, p.email
    FROM organization_members om
    JOIN profiles p ON p.id = om.user_id
    WHERE om.user_id != v_admin_user_id
  LOOP
    -- Update role to staff
    UPDATE organization_members
    SET role = 'staff'
    WHERE user_id = v_user.user_id
    AND organization_id = v_user.organization_id;

    RAISE NOTICE 'Updated % to staff role', v_user.email;

    -- Grant basic view permissions to common modules
    INSERT INTO user_module_permissions (
      organization_id,
      user_id,
      module,
      permission_level,
      is_enabled,
      granted_by
    )
    VALUES
      (v_user.organization_id, v_user.user_id, 'dashboard'::system_module, 'view'::permission_level, true, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'billing'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'payroll'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'whatsapp_crm'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'social_media'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'gmb'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'analytics'::system_module, 'view'::permission_level, true, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'customers'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'products'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'attendance'::system_module, 'view'::permission_level, true, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'ai_copilot'::system_module, 'none'::permission_level, false, v_admin_user_id),
      (v_user.organization_id, v_user.user_id, 'settings'::system_module, 'none'::permission_level, false, v_admin_user_id)
    ON CONFLICT (organization_id, user_id, module) 
    DO UPDATE SET 
      permission_level = EXCLUDED.permission_level,
      is_enabled = EXCLUDED.is_enabled,
      granted_by = EXCLUDED.granted_by,
      updated_at = NOW();

    RAISE NOTICE 'Set basic permissions for %', v_user.email;
  END LOOP;

END $$;

-- Verify all user roles
SELECT 
  p.email,
  p.full_name,
  om.role,
  om.is_active,
  o.name as organization_name
FROM profiles p
JOIN organization_members om ON om.user_id = p.id
JOIN organizations o ON o.id = om.organization_id
ORDER BY om.role DESC, p.email;
