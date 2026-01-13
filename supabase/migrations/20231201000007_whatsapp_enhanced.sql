-- Enhanced WhatsApp Business Platform Integration
-- Supports: Conversations, Templates, Flows, Media, Analytics

-- WhatsApp Business Accounts (Phone Numbers)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_number_id TEXT NOT NULL, -- Meta's phone number ID
  business_account_id TEXT NOT NULL, -- WhatsApp Business Account ID
  display_name TEXT NOT NULL,
  quality_rating TEXT DEFAULT 'unknown', -- green, yellow, red, unknown
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'restricted', 'flagged')),
  messaging_limit TEXT DEFAULT 'tier_1k', -- tier_250, tier_1k, tier_10k, tier_100k, tier_unlimited
  access_token TEXT, -- Encrypted
  webhook_url TEXT,
  webhook_verify_token TEXT,
  is_verified BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone_number_id)
);

-- WhatsApp Contacts
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  profile_name TEXT, -- WhatsApp profile name
  avatar_url TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_blocked BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, phone_number)
);

-- WhatsApp Conversations
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES profiles(id), -- Assigned team member
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, contact_id, whatsapp_account_id)
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  message_id TEXT, -- WhatsApp message ID
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contacts', 'template', 'interactive', 'reaction', 'sticker')),
  content TEXT, -- Message text content
  media_url TEXT, -- URL for media messages
  media_mime_type TEXT,
  media_caption TEXT,
  template_name TEXT, -- For template messages
  template_language TEXT,
  template_components JSONB, -- Template variables and buttons
  interactive_type TEXT, -- button, list, product, product_list
  interactive_data JSONB, -- Interactive message data
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_code TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  context_message_id TEXT, -- For replies
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- WhatsApp Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  category TEXT NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disabled')),
  components JSONB NOT NULL, -- Header, body, footer, buttons
  rejection_reason TEXT,
  template_id TEXT, -- Meta's template ID
  quality_score TEXT, -- green, yellow, red
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name, language)
);

-- WhatsApp Flows (Interactive Experiences)
CREATE TABLE IF NOT EXISTS whatsapp_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  flow_id TEXT, -- Meta's flow ID
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'deprecated')),
  flow_json JSONB NOT NULL, -- Flow definition
  categories TEXT[] DEFAULT '{}', -- e.g., ['SIGN_UP', 'LEAD_GENERATION']
  endpoint_uri TEXT, -- Webhook endpoint for flow data
  preview_url TEXT,
  validation_errors JSONB,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Flow Responses (User submissions)
CREATE TABLE IF NOT EXISTS whatsapp_flow_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL, -- User's form submission
  flow_token TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Media Library
CREATE TABLE IF NOT EXISTS whatsapp_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  media_id TEXT, -- Meta's media ID
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document', 'sticker')),
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- for audio/video in seconds
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Quick Replies (Saved responses)
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, shortcut)
);

-- WhatsApp Auto-Replies
CREATE TABLE IF NOT EXISTS whatsapp_auto_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'greeting', 'away', 'business_hours')),
  trigger_value TEXT, -- Keyword or condition
  response_message TEXT NOT NULL,
  response_template_id UUID REFERENCES whatsapp_templates(id),
  is_active BOOLEAN DEFAULT true,
  business_hours JSONB, -- For business_hours trigger
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp Analytics (Daily aggregates)
CREATE TABLE IF NOT EXISTS whatsapp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  conversations_active INTEGER DEFAULT 0,
  unique_contacts INTEGER DEFAULT 0,
  template_messages INTEGER DEFAULT 0,
  media_messages INTEGER DEFAULT 0,
  response_time_avg INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, whatsapp_account_id, date)
);

-- WhatsApp Broadcast Lists
CREATE TABLE IF NOT EXISTS whatsapp_broadcast_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  contact_ids UUID[] NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update existing whatsapp_campaigns table to link with new structure
ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS whatsapp_account_id UUID REFERENCES whatsapp_accounts(id) ON DELETE CASCADE;
ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES whatsapp_templates(id);
ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS broadcast_list_id UUID REFERENCES whatsapp_broadcast_lists(id);

-- Update campaign_recipients to link with contacts
ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_org ON whatsapp_conversations(organization_id, status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_org ON whatsapp_contacts(organization_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_org ON whatsapp_templates(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_date ON whatsapp_analytics(organization_id, date DESC);

-- Function to update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = CASE 
      WHEN NEW.type = 'text' THEN LEFT(NEW.content, 100)
      WHEN NEW.type = 'image' THEN '📷 Image'
      WHEN NEW.type = 'video' THEN '🎥 Video'
      WHEN NEW.type = 'audio' THEN '🎵 Audio'
      WHEN NEW.type = 'document' THEN '📄 Document'
      ELSE NEW.type
    END,
    unread_count = CASE 
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  -- Update contact last message time
  UPDATE whatsapp_contacts
  SET 
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.contact_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation updates
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON whatsapp_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to increment quick reply usage
CREATE OR REPLACE FUNCTION increment_quick_reply_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called from application logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flow_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_auto_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_broadcast_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their organization's data)
CREATE POLICY "Users can view their org's WhatsApp accounts" ON whatsapp_accounts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their org's WhatsApp contacts" ON whatsapp_contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their org's WhatsApp contacts" ON whatsapp_contacts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their org's conversations" ON whatsapp_conversations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their org's conversations" ON whatsapp_conversations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their org's messages" ON whatsapp_messages
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can send messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their org's templates" ON whatsapp_templates
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage their org's templates" ON whatsapp_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Add similar policies for other tables
CREATE POLICY "Users can view their org's flows" ON whatsapp_flows
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their org's analytics" ON whatsapp_analytics
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
