-- ============================================
-- CREATE AUTOMATION TABLES FOR N8N INTEGRATION
-- ============================================
-- Enable automation workflows for customers
-- Track executions and manage subscriptions
-- ============================================

-- Table 1: Automation Workflows
CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    n8n_workflow_id VARCHAR(255) UNIQUE,
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_data JSONB, -- Store n8n workflow JSON
    is_active BOOLEAN DEFAULT TRUE,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Automation Execution Logs
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    n8n_execution_id VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- success, error, running, waiting
    execution_time_ms INTEGER,
    error_message TEXT,
    input_data JSONB,
    output_data JSONB,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Automation Subscriptions (Pricing Tiers)
CREATE TABLE IF NOT EXISTS automation_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
    max_workflows INTEGER DEFAULT 5,
    max_executions_per_month INTEGER DEFAULT 100,
    current_month_executions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    billing_cycle_start DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Table 4: Automation Templates (Pre-built workflows)
CREATE TABLE IF NOT EXISTS automation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- invoice, whatsapp, crm, email, etc
    icon VARCHAR(50),
    workflow_template JSONB NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_workflows_org ON automation_workflows(organization_id);
CREATE INDEX idx_workflows_user ON automation_workflows(user_id);
CREATE INDEX idx_workflows_active ON automation_workflows(is_active);
CREATE INDEX idx_executions_workflow ON automation_executions(workflow_id);
CREATE INDEX idx_executions_status ON automation_executions(status);
CREATE INDEX idx_executions_date ON automation_executions(executed_at);
CREATE INDEX idx_subscriptions_org ON automation_subscriptions(organization_id);

-- Enable RLS (Row Level Security)
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_workflows
CREATE POLICY "Users can view their organization workflows" ON automation_workflows
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR
    auth.uid() IN (SELECT user_id FROM system_admins WHERE is_active = true)
);

CREATE POLICY "Users can create workflows in their organization" ON automation_workflows
FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their organization workflows" ON automation_workflows
FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their organization workflows" ON automation_workflows
FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
);

-- RLS Policies for automation_executions
CREATE POLICY "Users can view executions of their workflows" ON automation_executions
FOR SELECT
TO authenticated
USING (
    workflow_id IN (
        SELECT id FROM automation_workflows 
        WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    )
    OR
    auth.uid() IN (SELECT user_id FROM system_admins WHERE is_active = true)
);

-- RLS Policies for automation_subscriptions
CREATE POLICY "Users can view their organization subscription" ON automation_subscriptions
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR
    auth.uid() IN (SELECT user_id FROM system_admins WHERE is_active = true)
);

-- RLS Policies for automation_templates (Everyone can view)
CREATE POLICY "Everyone can view automation templates" ON automation_templates
FOR SELECT
TO authenticated
USING (true);

-- Function to reset monthly execution count
CREATE OR REPLACE FUNCTION reset_monthly_executions()
RETURNS void AS $$
BEGIN
    UPDATE automation_subscriptions
    SET 
        current_month_executions = 0,
        billing_cycle_start = CURRENT_DATE,
        updated_at = NOW()
    WHERE billing_cycle_start <= CURRENT_DATE - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- Function to increment execution count
CREATE OR REPLACE FUNCTION increment_execution_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update workflow execution count
    UPDATE automation_workflows
    SET 
        execution_count = execution_count + 1,
        last_executed_at = NEW.executed_at,
        updated_at = NOW()
    WHERE id = NEW.workflow_id;
    
    -- Update subscription monthly count
    UPDATE automation_subscriptions
    SET 
        current_month_executions = current_month_executions + 1,
        updated_at = NOW()
    WHERE organization_id = (
        SELECT organization_id FROM automation_workflows WHERE id = NEW.workflow_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment counts
CREATE TRIGGER trigger_increment_execution_count
AFTER INSERT ON automation_executions
FOR EACH ROW
EXECUTE FUNCTION increment_execution_count();

-- Insert default free subscription for existing organizations
INSERT INTO automation_subscriptions (organization_id, plan_type, max_workflows, max_executions_per_month)
SELECT 
    id,
    'free',
    5,
    100
FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

-- Insert some default automation templates
INSERT INTO automation_templates (name, description, category, icon, workflow_template, is_featured) VALUES
(
    'Send Invoice via WhatsApp',
    'Automatically send invoice PDF to customers via WhatsApp when created',
    'invoice',
    '📄',
    '{"nodes": [], "connections": {}}'::jsonb,
    true
),
(
    'Payment Reminder',
    'Send automated payment reminders for overdue invoices',
    'invoice',
    '⏰',
    '{"nodes": [], "connections": {}}'::jsonb,
    true
),
(
    'Customer Welcome Message',
    'Send welcome message to new customers via WhatsApp',
    'whatsapp',
    '👋',
    '{"nodes": [], "connections": {}}'::jsonb,
    true
),
(
    'Sync to Google Sheets',
    'Automatically sync customer data to Google Sheets',
    'crm',
    '📊',
    '{"nodes": [], "connections": {}}'::jsonb,
    false
),
(
    'Daily Revenue Report',
    'Send daily revenue report via email',
    'email',
    '💰',
    '{"nodes": [], "connections": {}}'::jsonb,
    false
);

-- Verify setup
SELECT '✅ Automation Tables Created Successfully' as status;

-- Show table counts
SELECT 
    'Tables Created:' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'automation_%') as table_count;

SELECT 
    'Templates Loaded:' as info,
    COUNT(*) as template_count
FROM automation_templates;
