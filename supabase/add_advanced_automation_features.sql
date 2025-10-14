-- ============================================
-- ADVANCED AUTOMATION FEATURES
-- ============================================
-- Workflow versioning, A/B testing, analytics, and more
-- ============================================

-- Table 1: Workflow Versions (Version Control)
CREATE TABLE IF NOT EXISTS automation_workflow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    workflow_data JSONB NOT NULL,
    changelog TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT FALSE,
    UNIQUE(workflow_id, version_number)
);

-- Table 2: A/B Testing Experiments
CREATE TABLE IF NOT EXISTS automation_ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_a_id UUID NOT NULL REFERENCES automation_workflows(id),
    workflow_b_id UUID NOT NULL REFERENCES automation_workflows(id),
    traffic_split INTEGER DEFAULT 50, -- Percentage to A (0-100)
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, completed
    winner_workflow_id UUID REFERENCES automation_workflows(id),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Advanced Analytics
CREATE TABLE IF NOT EXISTS automation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER DEFAULT 0,
    total_execution_time_ms BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, date)
);

-- Table 4: Workflow Actions/Nodes
CREATE TABLE IF NOT EXISTS automation_workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL,
    node_type VARCHAR(255) NOT NULL, -- http_request, send_email, condition, etc.
    node_name VARCHAR(255) NOT NULL,
    parameters JSONB,
    position_x INTEGER,
    position_y INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, node_id)
);

-- Table 5: Workflow Connections
CREATE TABLE IF NOT EXISTS automation_workflow_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    source_node_id VARCHAR(255) NOT NULL,
    source_output VARCHAR(255) DEFAULT 'main',
    target_node_id VARCHAR(255) NOT NULL,
    target_input VARCHAR(255) DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 6: Error Logs (Enhanced)
CREATE TABLE IF NOT EXISTS automation_error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES automation_executions(id),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    node_id VARCHAR(255),
    retry_count INTEGER DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 7: Workflow Variables (Dynamic Configuration)
CREATE TABLE IF NOT EXISTS automation_workflow_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    variable_name VARCHAR(255) NOT NULL,
    variable_value TEXT,
    variable_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, variable_name)
);

-- Table 8: Scheduled Executions
CREATE TABLE IF NOT EXISTS automation_scheduled_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL, -- cron, interval, specific_time
    schedule_config JSONB NOT NULL, -- {cron: "0 9 * * *"} or {interval: 3600}
    next_execution_at TIMESTAMP WITH TIME ZONE,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 9: Webhook Endpoints
CREATE TABLE IF NOT EXISTS automation_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    webhook_path VARCHAR(255) UNIQUE NOT NULL,
    webhook_method VARCHAR(10) DEFAULT 'POST', -- GET, POST, PUT, DELETE
    authentication_type VARCHAR(50), -- none, api_key, oauth
    authentication_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    request_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 10: Integration Credentials (Encrypted)
CREATE TABLE IF NOT EXISTS automation_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    credential_name VARCHAR(255) NOT NULL,
    credential_type VARCHAR(100) NOT NULL, -- whatsapp, email_smtp, google_sheets, etc.
    credential_data JSONB NOT NULL, -- Encrypted credentials
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, credential_name)
);

-- Table 11: Workflow Marketplace
CREATE TABLE IF NOT EXISTS automation_marketplace_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    tags TEXT[],
    workflow_template JSONB NOT NULL,
    author_id UUID REFERENCES profiles(id),
    price DECIMAL(10,2) DEFAULT 0.00,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 12: Workflow Comments/Annotations
CREATE TABLE IF NOT EXISTS automation_workflow_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    comment_text TEXT NOT NULL,
    node_id VARCHAR(255), -- Optional: comment on specific node
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_workflow_versions_workflow ON automation_workflow_versions(workflow_id);
CREATE INDEX idx_ab_tests_org ON automation_ab_tests(organization_id);
CREATE INDEX idx_ab_tests_status ON automation_ab_tests(status);
CREATE INDEX idx_analytics_workflow_date ON automation_analytics(workflow_id, date);
CREATE INDEX idx_workflow_nodes_workflow ON automation_workflow_nodes(workflow_id);
CREATE INDEX idx_error_logs_workflow ON automation_error_logs(workflow_id);
CREATE INDEX idx_error_logs_unresolved ON automation_error_logs(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_webhooks_path ON automation_webhooks(webhook_path);
CREATE INDEX idx_credentials_org ON automation_credentials(organization_id);
CREATE INDEX idx_marketplace_category ON automation_marketplace_workflows(category);
CREATE INDEX idx_marketplace_featured ON automation_marketplace_workflows(is_featured) WHERE is_featured = TRUE;

-- Enable RLS
ALTER TABLE automation_workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_scheduled_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_marketplace_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflow_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Same pattern: users can access their organization's data)
CREATE POLICY "Users can view their org workflow versions" ON automation_workflow_versions
FOR SELECT TO authenticated
USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can view their org AB tests" ON automation_ab_tests
FOR ALL TO authenticated
USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view their workflow analytics" ON automation_analytics
FOR SELECT TO authenticated
USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can manage their workflow nodes" ON automation_workflow_nodes
FOR ALL TO authenticated
USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can view their error logs" ON automation_error_logs
FOR SELECT TO authenticated
USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can manage their credentials" ON automation_credentials
FOR ALL TO authenticated
USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Everyone can view marketplace" ON automation_marketplace_workflows
FOR SELECT TO authenticated
USING (true);

-- Functions

-- Function: Update analytics daily
CREATE OR REPLACE FUNCTION update_workflow_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO automation_analytics (
        workflow_id,
        date,
        total_executions,
        successful_executions,
        failed_executions,
        avg_execution_time_ms,
        total_execution_time_ms
    )
    SELECT 
        workflow_id,
        DATE(executed_at) as date,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'error') as failed_executions,
        AVG(execution_time_ms)::INTEGER as avg_execution_time_ms,
        SUM(execution_time_ms) as total_execution_time_ms
    FROM automation_executions
    WHERE DATE(executed_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY workflow_id, DATE(executed_at)
    ON CONFLICT (workflow_id, date) 
    DO UPDATE SET
        total_executions = EXCLUDED.total_executions,
        successful_executions = EXCLUDED.successful_executions,
        failed_executions = EXCLUDED.failed_executions,
        avg_execution_time_ms = EXCLUDED.avg_execution_time_ms,
        total_execution_time_ms = EXCLUDED.total_execution_time_ms;
END;
$$ LANGUAGE plpgsql;

-- Function: Create workflow version
CREATE OR REPLACE FUNCTION create_workflow_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM automation_workflow_versions
    WHERE workflow_id = NEW.id;
    
    -- Create version
    INSERT INTO automation_workflow_versions (
        workflow_id,
        version_number,
        workflow_data,
        created_by,
        is_published
    ) VALUES (
        NEW.id,
        next_version,
        NEW.workflow_data,
        NEW.user_id,
        NEW.is_active
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-version on workflow update
CREATE TRIGGER trigger_create_workflow_version
AFTER UPDATE OF workflow_data ON automation_workflows
FOR EACH ROW
WHEN (OLD.workflow_data IS DISTINCT FROM NEW.workflow_data)
EXECUTE FUNCTION create_workflow_version();

-- Insert Advanced Templates
INSERT INTO automation_templates (name, description, category, icon, workflow_template, is_featured) VALUES
(
    'Conditional Invoice Processing',
    'Process invoices differently based on amount and customer type',
    'invoice',
    '🔀',
    '{"nodes": [{"type": "condition", "name": "Check Amount"}], "connections": {}}'::jsonb,
    true
),
(
    'Multi-Step Customer Onboarding',
    'Complete onboarding workflow with email, SMS, and CRM updates',
    'crm',
    '📋',
    '{"nodes": [{"type": "multi-step", "name": "Onboarding"}], "connections": {}}'::jsonb,
    true
),
(
    'Error Handling & Retry Logic',
    'Advanced error handling with automatic retries and notifications',
    'advanced',
    '🔄',
    '{"nodes": [{"type": "error-handler", "name": "Retry"}], "connections": {}}'::jsonb,
    false
),
(
    'Data Transformation Pipeline',
    'Transform and enrich customer data from multiple sources',
    'data',
    '⚙️',
    '{"nodes": [{"type": "transform", "name": "Pipeline"}], "connections": {}}'::jsonb,
    false
),
(
    'AI-Powered Response Generator',
    'Use AI to generate personalized responses based on customer data',
    'ai',
    '🤖',
    '{"nodes": [{"type": "ai", "name": "AI Response"}], "connections": {}}'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT '✅ Advanced Automation Features Created' as status;

-- Show counts
SELECT 
    'Advanced Tables:' as info,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name LIKE 'automation_%') as total_automation_tables;

SELECT 
    'Total Templates:' as info,
    COUNT(*) as template_count
FROM automation_templates;
