-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(invoice_id_param UUID)
RETURNS void AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_tax_amount DECIMAL(10,2);
BEGIN
    -- Calculate subtotal and tax from invoice items
    SELECT 
        COALESCE(SUM(line_total), 0),
        COALESCE(SUM(line_total * tax_rate / 100), 0)
    INTO v_subtotal, v_tax_amount
    FROM invoice_items
    WHERE invoice_id = invoice_id_param;
    
    -- Update invoice totals
    UPDATE invoices
    SET 
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_subtotal + v_tax_amount - COALESCE(discount_amount, 0),
        updated_at = NOW()
    WHERE id = invoice_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate invoice totals when items change
CREATE OR REPLACE FUNCTION trigger_calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_invoice_totals(OLD.invoice_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_invoice_totals(NEW.invoice_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_items_calculate_totals
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_invoice_totals();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_month TEXT;
    v_sequence INT;
    v_invoice_number TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    v_month := TO_CHAR(NOW(), 'MM');
    
    -- Get the next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM invoices
    WHERE organization_id = org_id
    AND invoice_number LIKE 'INV-' || v_year || '-' || v_month || '-%';
    
    v_invoice_number := 'INV-' || v_year || '-' || v_month || '-' || LPAD(v_sequence::TEXT, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check invoice payment status
CREATE OR REPLACE FUNCTION check_invoice_payment_status(invoice_id_param UUID)
RETURNS void AS $$
DECLARE
    v_total_amount DECIMAL(10,2);
    v_total_paid DECIMAL(10,2);
BEGIN
    -- Get invoice total
    SELECT total_amount INTO v_total_amount
    FROM invoices
    WHERE id = invoice_id_param;
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments
    WHERE invoice_id = invoice_id_param;
    
    -- Update invoice status
    IF v_total_paid >= v_total_amount THEN
        UPDATE invoices
        SET status = 'paid', updated_at = NOW()
        WHERE id = invoice_id_param;
    ELSIF v_total_paid > 0 THEN
        UPDATE invoices
        SET status = 'partially_paid', updated_at = NOW()
        WHERE id = invoice_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check payment status when payment is added
CREATE OR REPLACE FUNCTION trigger_check_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM check_invoice_payment_status(NEW.invoice_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_check_status
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_check_payment_status();

-- Function to check overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE due_date < CURRENT_DATE
    AND status NOT IN ('paid', 'cancelled', 'overdue');
END;
$$ LANGUAGE plpgsql;

-- Function to get organization stats
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_customers', (
            SELECT COUNT(*) FROM customers WHERE organization_id = org_id
        ),
        'total_invoices', (
            SELECT COUNT(*) FROM invoices WHERE organization_id = org_id
        ),
        'total_revenue', (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM invoices 
            WHERE organization_id = org_id AND status = 'paid'
        ),
        'pending_amount', (
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM invoices 
            WHERE organization_id = org_id AND status IN ('sent', 'overdue')
        ),
        'overdue_invoices', (
            SELECT COUNT(*) 
            FROM invoices 
            WHERE organization_id = org_id AND status = 'overdue'
        ),
        'total_employees', (
            SELECT COUNT(*) 
            FROM employees 
            WHERE organization_id = org_id AND is_active = true
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly revenue report
CREATE OR REPLACE FUNCTION get_monthly_revenue(org_id UUID, year_param INT)
RETURNS TABLE(month INT, revenue DECIMAL, invoice_count INT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(MONTH FROM invoice_date)::INT as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*)::INT as invoice_count
    FROM invoices
    WHERE organization_id = org_id
    AND EXTRACT(YEAR FROM invoice_date) = year_param
    AND status IN ('paid', 'sent')
    GROUP BY EXTRACT(MONTH FROM invoice_date)
    ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_usage(
    org_id UUID,
    feature_name TEXT,
    usage_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO usage_tracking (
        organization_id,
        feature,
        usage_count,
        usage_date,
        metadata
    )
    VALUES (
        org_id,
        feature_name,
        1,
        CURRENT_DATE,
        usage_metadata
    )
    ON CONFLICT (organization_id, feature, usage_date)
    DO UPDATE SET
        usage_count = usage_tracking.usage_count + 1,
        metadata = usage_metadata;
END;
$$ LANGUAGE plpgsql;

-- Function to send overdue payment reminders
CREATE OR REPLACE FUNCTION get_overdue_invoices_for_reminders()
RETURNS TABLE(
    invoice_id UUID,
    organization_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    invoice_number TEXT,
    total_amount DECIMAL,
    due_date DATE,
    days_overdue INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as invoice_id,
        i.organization_id,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        i.invoice_number,
        i.total_amount,
        i.due_date,
        (CURRENT_DATE - i.due_date)::INT as days_overdue
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.status = 'overdue'
    AND i.due_date < CURRENT_DATE
    ORDER BY i.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(organization_id, status, invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(organization_id, due_date) WHERE status != 'paid';
CREATE INDEX IF NOT EXISTS idx_payments_invoice_date ON payments(invoice_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_date ON usage_tracking(organization_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(organization_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON whatsapp_campaigns(organization_id, status, created_at);
