-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = org_id 
        AND user_id = user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in organization
CREATE OR REPLACE FUNCTION get_user_role(org_id UUID, user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM organization_members 
    WHERE organization_id = org_id 
    AND user_id = user_id 
    AND is_active = true;
    
    RETURN COALESCE(user_role_val, 'staff'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        is_organization_member(id, auth.uid())
    );

CREATE POLICY "Owners can update their organizations" ON organizations
    FOR UPDATE USING (
        get_user_role(id, auth.uid()) IN ('owner', 'manager')
    );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organization members policies
CREATE POLICY "Users can view members of their organizations" ON organization_members
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "Owners can manage organization members" ON organization_members
    FOR ALL USING (
        get_user_role(organization_id, auth.uid()) IN ('owner', 'manager')
    );

-- Customers policies
CREATE POLICY "Users can view customers of their organizations" ON customers
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "Users can manage customers of their organizations" ON customers
    FOR ALL USING (
        is_organization_member(organization_id, auth.uid())
    );

-- Products policies
CREATE POLICY "Users can view products of their organizations" ON products
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "Users can manage products of their organizations" ON products
    FOR ALL USING (
        is_organization_member(organization_id, auth.uid())
    );

-- Invoices policies
CREATE POLICY "Users can view invoices of their organizations" ON invoices
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "Users can manage invoices of their organizations" ON invoices
    FOR ALL USING (
        is_organization_member(organization_id, auth.uid())
    );

-- Invoice items policies
CREATE POLICY "Users can view invoice items of their organizations" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND is_organization_member(invoices.organization_id, auth.uid())
        )
    );

CREATE POLICY "Users can manage invoice items of their organizations" ON invoice_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND is_organization_member(invoices.organization_id, auth.uid())
        )
    );

-- Payments policies
CREATE POLICY "Users can view payments of their organizations" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = payments.invoice_id 
            AND is_organization_member(invoices.organization_id, auth.uid())
        )
    );

CREATE POLICY "Users can manage payments of their organizations" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = payments.invoice_id 
            AND is_organization_member(invoices.organization_id, auth.uid())
        )
    );

-- Employees policies
CREATE POLICY "Users can view employees of their organizations" ON employees
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "HR and above can manage employees" ON employees
    FOR ALL USING (
        get_user_role(organization_id, auth.uid()) IN ('owner', 'manager', 'hr')
    );

-- Attendance policies
CREATE POLICY "Users can view attendance of their organizations" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = attendance.employee_id 
            AND is_organization_member(employees.organization_id, auth.uid())
        )
    );

CREATE POLICY "HR and above can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = attendance.employee_id 
            AND get_user_role(employees.organization_id, auth.uid()) IN ('owner', 'manager', 'hr')
        )
    );

-- Payroll policies
CREATE POLICY "Users can view payroll of their organizations" ON payroll
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "HR and above can manage payroll" ON payroll
    FOR ALL USING (
        get_user_role(organization_id, auth.uid()) IN ('owner', 'manager', 'hr')
    );

-- WhatsApp campaigns policies
CREATE POLICY "Users can view campaigns of their organizations" ON whatsapp_campaigns
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "Users can manage campaigns of their organizations" ON whatsapp_campaigns
    FOR ALL USING (
        is_organization_member(organization_id, auth.uid())
    );

-- Campaign recipients policies
CREATE POLICY "Users can view campaign recipients of their organizations" ON campaign_recipients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM whatsapp_campaigns 
            WHERE whatsapp_campaigns.id = campaign_recipients.campaign_id 
            AND is_organization_member(whatsapp_campaigns.organization_id, auth.uid())
        )
    );

CREATE POLICY "Users can manage campaign recipients of their organizations" ON campaign_recipients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM whatsapp_campaigns 
            WHERE whatsapp_campaigns.id = campaign_recipients.campaign_id 
            AND is_organization_member(whatsapp_campaigns.organization_id, auth.uid())
        )
    );

-- AI tasks policies
CREATE POLICY "Users can view AI tasks of their organizations" ON ai_tasks
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "Users can manage AI tasks of their organizations" ON ai_tasks
    FOR ALL USING (
        is_organization_member(organization_id, auth.uid())
    );

-- Usage tracking policies
CREATE POLICY "Users can view usage tracking of their organizations" ON usage_tracking
    FOR SELECT USING (
        is_organization_member(organization_id, auth.uid())
    );

CREATE POLICY "System can insert usage tracking" ON usage_tracking
    FOR INSERT WITH CHECK (true);

-- Allow public access to organizations for website visitors (as per memory)
CREATE POLICY "Public can view organizations" ON organizations
    FOR SELECT USING (true);

-- Allow public access to products for website visitors
CREATE POLICY "Public can view products" ON products
    FOR SELECT USING (true);

-- Allow public access to customers for website visitors
CREATE POLICY "Public can view customers" ON customers
    FOR SELECT USING (true);
