-- Advanced Billing Features
-- Recurring Billing, Payment Processing, Automated Reminders, Integration, AP Management

-- Recurring Billing Plans
CREATE TABLE IF NOT EXISTS billing_recurring_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES billing_products(id) ON DELETE SET NULL,
  
  -- Billing Details
  amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00,
  
  -- Recurrence
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  auto_send_invoice BOOLEAN DEFAULT true,
  auto_charge BOOLEAN DEFAULT false,
  
  -- Metadata
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Reminders
CREATE TABLE IF NOT EXISTS billing_payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  
  -- Reminder Details
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'on_due', 'after_due')),
  days_offset INTEGER NOT NULL, -- -7 (7 days before), 0 (on due date), 7 (7 days after)
  scheduled_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  
  -- Communication
  send_via TEXT[] DEFAULT ARRAY['email'], -- email, sms, whatsapp
  email_subject TEXT,
  email_body TEXT,
  sms_body TEXT,
  whatsapp_template_id TEXT,
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods (Saved for customers)
CREATE TABLE IF NOT EXISTS billing_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_account', 'upi', 'card', 'wallet')),
  is_default BOOLEAN DEFAULT false,
  
  -- Bank Details
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  
  -- UPI
  upi_id TEXT,
  
  -- Card (tokenized)
  card_last4 TEXT,
  card_brand TEXT,
  card_expiry TEXT,
  card_token TEXT,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Gateway Transactions
CREATE TABLE IF NOT EXISTS billing_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES billing_payments(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'payout')),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Gateway Details
  gateway_name TEXT, -- razorpay, stripe, paytm, etc.
  gateway_transaction_id TEXT,
  gateway_order_id TEXT,
  gateway_payment_method TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  
  -- Metadata
  gateway_response JSONB,
  error_code TEXT,
  error_message TEXT,
  
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts Payable (Supplier Bills)
CREATE TABLE IF NOT EXISTS billing_ap_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE RESTRICT,
  
  -- Bill Details
  bill_number TEXT NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  balance_amount DECIMAL(15,2) NOT NULL,
  
  -- Status & Approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'partial', 'overdue')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Payment
  payment_method TEXT CHECK (payment_method IN ('bank', 'cash', 'cheque', 'upi', 'card', 'other')),
  payment_date DATE,
  payment_reference TEXT,
  
  -- Attachments
  attachment_urls TEXT[],
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, bill_number)
);

-- AP Bill Items
CREATE TABLE IF NOT EXISTS billing_ap_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES billing_ap_bills(id) ON DELETE CASCADE,
  product_id UUID REFERENCES billing_products(id) ON DELETE SET NULL,
  
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  rate DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  amount DECIMAL(15,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Reconciliation
CREATE TABLE IF NOT EXISTS billing_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  reconciliation_date DATE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'cash', 'upi', 'card')),
  account_name TEXT NOT NULL,
  
  -- Balances
  opening_balance DECIMAL(15,2) NOT NULL,
  closing_balance DECIMAL(15,2) NOT NULL,
  system_balance DECIMAL(15,2) NOT NULL,
  difference DECIMAL(15,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reconciled', 'discrepancy')),
  
  -- Reconciliation Details
  total_receipts DECIMAL(15,2) DEFAULT 0,
  total_payments DECIMAL(15,2) DEFAULT 0,
  unmatched_transactions JSONB,
  
  notes TEXT,
  reconciled_by UUID REFERENCES profiles(id),
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Logs
CREATE TABLE IF NOT EXISTS billing_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  integration_type TEXT NOT NULL, -- crm, erp, accounting, payment_gateway
  integration_name TEXT NOT NULL, -- salesforce, zoho, tally, razorpay, etc.
  
  action TEXT NOT NULL, -- sync, export, import, webhook
  entity_type TEXT NOT NULL, -- invoice, customer, product, payment
  entity_id UUID,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'partial')),
  
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS billing_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credit_note_number TEXT NOT NULL,
  credit_note_date DATE NOT NULL,
  
  customer_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
  
  reason TEXT NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'applied', 'void')),
  applied_to_invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
  
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, credit_note_number)
);

-- Debit Notes
CREATE TABLE IF NOT EXISTS billing_debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  debit_note_number TEXT NOT NULL,
  debit_note_date DATE NOT NULL,
  
  supplier_id UUID NOT NULL REFERENCES billing_customers(id) ON DELETE RESTRICT,
  bill_id UUID REFERENCES billing_ap_bills(id) ON DELETE SET NULL,
  
  reason TEXT NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'applied', 'void')),
  
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, debit_note_number)
);

-- Create indexes
CREATE INDEX idx_recurring_plans_org ON billing_recurring_plans(organization_id);
CREATE INDEX idx_recurring_plans_customer ON billing_recurring_plans(customer_id);
CREATE INDEX idx_recurring_plans_next_billing ON billing_recurring_plans(next_billing_date);
CREATE INDEX idx_payment_reminders_org ON billing_payment_reminders(organization_id);
CREATE INDEX idx_payment_reminders_invoice ON billing_payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_scheduled ON billing_payment_reminders(scheduled_date, status);
CREATE INDEX idx_payment_methods_customer ON billing_payment_methods(customer_id);
CREATE INDEX idx_payment_transactions_org ON billing_payment_transactions(organization_id);
CREATE INDEX idx_payment_transactions_gateway ON billing_payment_transactions(gateway_transaction_id);
CREATE INDEX idx_ap_bills_org ON billing_ap_bills(organization_id);
CREATE INDEX idx_ap_bills_supplier ON billing_ap_bills(supplier_id);
CREATE INDEX idx_ap_bills_status ON billing_ap_bills(status);
CREATE INDEX idx_reconciliation_org ON billing_reconciliation(organization_id);
CREATE INDEX idx_integration_logs_org ON billing_integration_logs(organization_id);
CREATE INDEX idx_credit_notes_org ON billing_credit_notes(organization_id);
CREATE INDEX idx_debit_notes_org ON billing_debit_notes(organization_id);

-- Enable RLS
ALTER TABLE billing_recurring_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_ap_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_ap_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_debit_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern for all tables)
CREATE POLICY "Users can view their org's recurring plans"
  ON billing_recurring_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_recurring_plans.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's recurring plans"
  ON billing_recurring_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_recurring_plans.organization_id
      AND user_id = auth.uid()
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view their org's payment reminders" ON billing_payment_reminders FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_payment_reminders.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's payment reminders" ON billing_payment_reminders FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_payment_reminders.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their org's payment methods" ON billing_payment_methods FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_payment_methods.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's payment methods" ON billing_payment_methods FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_payment_methods.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their org's payment transactions" ON billing_payment_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_payment_transactions.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's payment transactions" ON billing_payment_transactions FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_payment_transactions.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their org's AP bills" ON billing_ap_bills FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_ap_bills.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's AP bills" ON billing_ap_bills FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_ap_bills.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view AP bill items" ON billing_ap_bill_items FOR SELECT USING (EXISTS (SELECT 1 FROM billing_ap_bills b JOIN organization_members om ON b.organization_id = om.organization_id WHERE b.id = billing_ap_bill_items.bill_id AND om.user_id = auth.uid()));
CREATE POLICY "Users can manage AP bill items" ON billing_ap_bill_items FOR ALL USING (EXISTS (SELECT 1 FROM billing_ap_bills b JOIN organization_members om ON b.organization_id = om.organization_id WHERE b.id = billing_ap_bill_items.bill_id AND om.user_id = auth.uid()));

CREATE POLICY "Users can view their org's reconciliation" ON billing_reconciliation FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_reconciliation.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's reconciliation" ON billing_reconciliation FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_reconciliation.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their org's integration logs" ON billing_integration_logs FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_integration_logs.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can create integration logs" ON billing_integration_logs FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_integration_logs.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their org's credit notes" ON billing_credit_notes FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_credit_notes.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's credit notes" ON billing_credit_notes FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_credit_notes.organization_id AND user_id = auth.uid()));

CREATE POLICY "Users can view their org's debit notes" ON billing_debit_notes FOR SELECT USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_debit_notes.organization_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage their org's debit notes" ON billing_debit_notes FOR ALL USING (EXISTS (SELECT 1 FROM organization_members WHERE organization_id = billing_debit_notes.organization_id AND user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_recurring_plans_updated_at BEFORE UPDATE ON billing_recurring_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_reminders_updated_at BEFORE UPDATE ON billing_payment_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON billing_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ap_bills_updated_at BEFORE UPDATE ON billing_ap_bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_notes_updated_at BEFORE UPDATE ON billing_credit_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debit_notes_updated_at BEFORE UPDATE ON billing_debit_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to process recurring billing
CREATE OR REPLACE FUNCTION process_recurring_billing()
RETURNS void AS $$
DECLARE
  v_plan RECORD;
  v_invoice_id UUID;
BEGIN
  FOR v_plan IN 
    SELECT * FROM billing_recurring_plans 
    WHERE status = 'active' 
    AND next_billing_date <= CURRENT_DATE
  LOOP
    -- Create invoice from recurring plan
    INSERT INTO billing_invoices (
      organization_id, invoice_type, invoice_number, invoice_date, due_date,
      customer_id, total_amount, balance_amount, status, payment_status, notes
    ) VALUES (
      v_plan.organization_id, 'sales', 
      'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(v_plan.id::TEXT, 1, 8),
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      v_plan.customer_id,
      v_plan.amount * (1 + v_plan.tax_rate / 100),
      v_plan.amount * (1 + v_plan.tax_rate / 100),
      CASE WHEN v_plan.auto_send_invoice THEN 'sent' ELSE 'draft' END,
      'unpaid',
      'Auto-generated from recurring plan: ' || v_plan.plan_name
    ) RETURNING id INTO v_invoice_id;
    
    -- Add invoice item
    IF v_plan.product_id IS NOT NULL THEN
      INSERT INTO billing_invoice_items (
        invoice_id, product_id, item_name, quantity, unit, rate,
        taxable_amount, tax_rate, tax_amount, total_amount
      )
      SELECT 
        v_invoice_id, v_plan.product_id, p.name, 1, p.unit, v_plan.amount,
        v_plan.amount, v_plan.tax_rate, 
        v_plan.amount * v_plan.tax_rate / 100,
        v_plan.amount * (1 + v_plan.tax_rate / 100)
      FROM billing_products p WHERE p.id = v_plan.product_id;
    END IF;
    
    -- Update next billing date
    UPDATE billing_recurring_plans
    SET next_billing_date = CASE
      WHEN frequency = 'daily' THEN next_billing_date + INTERVAL '1 day'
      WHEN frequency = 'weekly' THEN next_billing_date + INTERVAL '1 week'
      WHEN frequency = 'monthly' THEN next_billing_date + INTERVAL '1 month'
      WHEN frequency = 'quarterly' THEN next_billing_date + INTERVAL '3 months'
      WHEN frequency = 'yearly' THEN next_billing_date + INTERVAL '1 year'
    END,
    status = CASE
      WHEN end_date IS NOT NULL AND next_billing_date >= end_date THEN 'expired'
      ELSE status
    END
    WHERE id = v_plan.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE billing_recurring_plans IS 'Recurring billing subscriptions';
COMMENT ON TABLE billing_payment_reminders IS 'Automated payment reminders';
COMMENT ON TABLE billing_payment_methods IS 'Saved payment methods';
COMMENT ON TABLE billing_payment_transactions IS 'Payment gateway transactions';
COMMENT ON TABLE billing_ap_bills IS 'Accounts Payable - Supplier Bills';
COMMENT ON TABLE billing_reconciliation IS 'Payment reconciliation records';
COMMENT ON TABLE billing_integration_logs IS 'CRM/ERP integration logs';
COMMENT ON TABLE billing_credit_notes IS 'Credit notes for sales returns';
COMMENT ON TABLE billing_debit_notes IS 'Debit notes for purchase returns';
