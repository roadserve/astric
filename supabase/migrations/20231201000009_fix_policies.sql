-- Fix duplicate policies by dropping and recreating them

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their org's WhatsApp accounts" ON whatsapp_accounts;
DROP POLICY IF EXISTS "Users can insert WhatsApp accounts for their org" ON whatsapp_accounts;
DROP POLICY IF EXISTS "Users can update their org's WhatsApp accounts" ON whatsapp_accounts;
DROP POLICY IF EXISTS "Users can delete their org's WhatsApp accounts" ON whatsapp_accounts;

-- Recreate policies
CREATE POLICY "Users can view their org's WhatsApp accounts"
  ON whatsapp_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_accounts.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert WhatsApp accounts for their org"
  ON whatsapp_accounts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_accounts.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's WhatsApp accounts"
  ON whatsapp_accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_accounts.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org's WhatsApp accounts"
  ON whatsapp_accounts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_accounts.organization_id
      AND user_id = auth.uid()
    )
  );
