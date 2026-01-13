-- Create whatsapp_message_status_log table
CREATE TABLE IF NOT EXISTS whatsapp_message_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- sent, delivered, read, failed
  timestamp TIMESTAMPTZ NOT NULL,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_whatsapp_message_status_log_message_id ON whatsapp_message_status_log(message_id);
CREATE INDEX idx_whatsapp_message_status_log_timestamp ON whatsapp_message_status_log(timestamp DESC);

-- Enable RLS
ALTER TABLE whatsapp_message_status_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view status logs for their organization"
  ON whatsapp_message_status_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_messages wm
      JOIN whatsapp_conversations wc ON wm.conversation_id = wc.id
      JOIN whatsapp_contacts wco ON wc.contact_id = wco.id
      JOIN organization_members om ON wco.organization_id = om.organization_id
      WHERE wm.id = whatsapp_message_status_log.message_id
      AND om.user_id = auth.uid()
    )
  );

-- Create webhook logs table
CREATE TABLE IF NOT EXISTS whatsapp_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_type TEXT NOT NULL, -- whatsapp, instagram, facebook
  event_type TEXT NOT NULL, -- message, status, template_update, etc.
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_whatsapp_webhook_logs_org ON whatsapp_webhook_logs(organization_id);
CREATE INDEX idx_whatsapp_webhook_logs_created ON whatsapp_webhook_logs(created_at DESC);
CREATE INDEX idx_whatsapp_webhook_logs_processed ON whatsapp_webhook_logs(processed);

-- Enable RLS
ALTER TABLE whatsapp_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view webhook logs for their organization"
  ON whatsapp_webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = whatsapp_webhook_logs.organization_id
      AND user_id = auth.uid()
    )
  );

-- Add quality_score to templates table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_templates' 
    AND column_name = 'quality_score'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN quality_score TEXT;
  END IF;
END $$;

-- Add rejection_reason to templates table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_templates' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE whatsapp_templates ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Add whatsapp_message_id to messages table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' 
    AND column_name = 'whatsapp_message_id'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN whatsapp_message_id TEXT UNIQUE;
  END IF;
END $$;

-- Add delivered_at and read_at to messages table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' 
    AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add metadata column to messages for storing additional data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_messages' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE whatsapp_messages ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add unread_count to conversations if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_conversations' 
    AND column_name = 'unread_count'
  ) THEN
    ALTER TABLE whatsapp_conversations ADD COLUMN unread_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET 
    last_message_at = NEW.sent_at,
    unread_count = CASE 
      WHEN NEW.direction = 'inbound' THEN unread_count + 1 
      ELSE unread_count 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation updates
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON whatsapp_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Create function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conversation_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET unread_count = 0
  WHERE id = conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE whatsapp_message_status_log IS 'Logs all status changes for WhatsApp messages';
COMMENT ON TABLE whatsapp_webhook_logs IS 'Logs all incoming webhook events for debugging';
