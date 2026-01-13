-- Simple Billing System (Tally-like)
-- Tables: Customers, Products, Invoices, Invoice Items, Payments, Expenses

-- Customers/Parties
CREATE TABLE IF NOT EXISTS billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_type TEXT DEFAULT 'customer' CHECK (customer_type IN ('customer', 'supplier', 'both')),
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  gstin TEXT, -- GST Number
  pan TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  opening_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  credit_days INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products/Items
CREATE TABLE IF NOT EXISTS billing_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type TEXT DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT, -- HSN/SAC Code
  sku TEXT,
  unit TEXT DEFAULT 'pcs', -- pcs, kg, ltr, box, etc.
  purchase_price DECIMAL(15,2) DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST %
  stock_quantity DECIMAL(15,3) DEFAULT 0,
  min_stock_level DECIMAL(15,3) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (Sales & Purchase)
CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('sales', 'purchase', 'sales_return', 'purchase_return')),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  customer_id UUID REFERENCES billing_customers(id) ON DELETE RESTRICT,
  
  -- Amounts
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  shipping_charges DECIMAL(15,2) DEFAULT 0,
  other_charges DECIMAL(15,2) DEFAULT 0,
  round_off DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  balance_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  
  -- Additional Info
  reference_number TEXT,
  notes TEXT,
  terms_conditions TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, invoice_number)
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS billing_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES billing_products(id) ON DELETE RESTRICT,
  
  item_name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  rate DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  taxable_amount DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('received', 'paid')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES billing_customers(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
  
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'upi', 'card', 'cheque', 'other')),
  
  -- Bank/UPI Details
  bank_name TEXT,
  transaction_id TEXT,
  cheque_number TEXT,
  cheque_date DATE,
  
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS billing_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL, -- Rent, Salary, Utilities, etc.
  vendor_id UUID REFERENCES billing_customers(id) ON DELETE SET NULL,
  
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'upi', 'card', 'cheque', 'other')),
  reference_number TEXT,
  description TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations
CREATE TABLE IF NOT EXISTS billing_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  customer_id UUID REFERENCES billing_customers(id) ON DELETE RESTRICT,
  
  subtotal DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  converted_to_invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
  
  notes TEXT,
  terms_conditions TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, quotation_number)
);

-- Quotation Items
CREATE TABLE IF NOT EXISTS billing_quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES billing_quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES billing_products(id) ON DELETE RESTRICT,
  
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(15,3) NOT NULL,
  unit TEXT DEFAULT 'pcs',
  rate DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_billing_customers_org ON billing_customers(organization_id);
CREATE INDEX idx_billing_products_org ON billing_products(organization_id);
CREATE INDEX idx_billing_invoices_org ON billing_invoices(organization_id);
CREATE INDEX idx_billing_invoices_customer ON billing_invoices(customer_id);
CREATE INDEX idx_billing_invoices_date ON billing_invoices(invoice_date DESC);
CREATE INDEX idx_billing_invoices_status ON billing_invoices(status);
CREATE INDEX idx_billing_invoice_items_invoice ON billing_invoice_items(invoice_id);
CREATE INDEX idx_billing_payments_org ON billing_payments(organization_id);
CREATE INDEX idx_billing_payments_customer ON billing_payments(customer_id);
CREATE INDEX idx_billing_payments_date ON billing_payments(payment_date DESC);
CREATE INDEX idx_billing_expenses_org ON billing_expenses(organization_id);
CREATE INDEX idx_billing_expenses_date ON billing_expenses(expense_date DESC);

-- Enable RLS
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_quotation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Customers
CREATE POLICY "Users can view their org's customers"
  ON billing_customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_customers.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert customers for their org"
  ON billing_customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_customers.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org's customers"
  ON billing_customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_customers.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org's customers"
  ON billing_customers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_customers.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Products (similar pattern)
CREATE POLICY "Users can view their org's products"
  ON billing_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_products.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's products"
  ON billing_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_products.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Invoices
CREATE POLICY "Users can view their org's invoices"
  ON billing_invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_invoices.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's invoices"
  ON billing_invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_invoices.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Invoice Items
CREATE POLICY "Users can view invoice items"
  ON billing_invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_invoices bi
      JOIN organization_members om ON bi.organization_id = om.organization_id
      WHERE bi.id = billing_invoice_items.invoice_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage invoice items"
  ON billing_invoice_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_invoices bi
      JOIN organization_members om ON bi.organization_id = om.organization_id
      WHERE bi.id = billing_invoice_items.invoice_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for Payments
CREATE POLICY "Users can view their org's payments"
  ON billing_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_payments.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's payments"
  ON billing_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_payments.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Expenses
CREATE POLICY "Users can view their org's expenses"
  ON billing_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_expenses.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's expenses"
  ON billing_expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_expenses.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Quotations
CREATE POLICY "Users can view their org's quotations"
  ON billing_quotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_quotations.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org's quotations"
  ON billing_quotations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = billing_quotations.organization_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Quotation Items
CREATE POLICY "Users can view quotation items"
  ON billing_quotation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM billing_quotations bq
      JOIN organization_members om ON bq.organization_id = om.organization_id
      WHERE bq.id = billing_quotation_items.quotation_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage quotation items"
  ON billing_quotation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM billing_quotations bq
      JOIN organization_members om ON bq.organization_id = om.organization_id
      WHERE bq.id = billing_quotation_items.quotation_id
      AND om.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_customers_updated_at BEFORE UPDATE ON billing_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_products_updated_at BEFORE UPDATE ON billing_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_invoices_updated_at BEFORE UPDATE ON billing_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_payments_updated_at BEFORE UPDATE ON billing_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_expenses_updated_at BEFORE UPDATE ON billing_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_quotations_updated_at BEFORE UPDATE ON billing_quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update customer balance when invoice is created
    IF NEW.invoice_type IN ('sales', 'purchase_return') THEN
      UPDATE billing_customers
      SET current_balance = current_balance + NEW.balance_amount
      WHERE id = NEW.customer_id;
    ELSIF NEW.invoice_type IN ('purchase', 'sales_return') THEN
      UPDATE billing_customers
      SET current_balance = current_balance - NEW.balance_amount
      WHERE id = NEW.customer_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update when balance changes
    IF OLD.balance_amount != NEW.balance_amount THEN
      IF NEW.invoice_type IN ('sales', 'purchase_return') THEN
        UPDATE billing_customers
        SET current_balance = current_balance - OLD.balance_amount + NEW.balance_amount
        WHERE id = NEW.customer_id;
      ELSIF NEW.invoice_type IN ('purchase', 'sales_return') THEN
        UPDATE billing_customers
        SET current_balance = current_balance + OLD.balance_amount - NEW.balance_amount
        WHERE id = NEW.customer_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_balance
  AFTER INSERT OR UPDATE ON billing_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();

-- Function to update invoice totals when items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal DECIMAL(15,2);
  v_tax_amount DECIMAL(15,2);
BEGIN
  -- Calculate totals from invoice items
  SELECT 
    COALESCE(SUM(taxable_amount), 0),
    COALESCE(SUM(tax_amount), 0)
  INTO v_subtotal, v_tax_amount
  FROM billing_invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update invoice
  UPDATE billing_invoices
  SET 
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total_amount = v_subtotal + v_tax_amount + COALESCE(shipping_charges, 0) + COALESCE(other_charges, 0) - COALESCE(discount_amount, 0) + COALESCE(round_off, 0),
    balance_amount = v_subtotal + v_tax_amount + COALESCE(shipping_charges, 0) + COALESCE(other_charges, 0) - COALESCE(discount_amount, 0) + COALESCE(round_off, 0) - COALESCE(paid_amount, 0)
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON billing_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();

COMMENT ON TABLE billing_customers IS 'Customers and Suppliers (Parties)';
COMMENT ON TABLE billing_products IS 'Products and Services';
COMMENT ON TABLE billing_invoices IS 'Sales and Purchase Invoices';
COMMENT ON TABLE billing_invoice_items IS 'Invoice line items';
COMMENT ON TABLE billing_payments IS 'Payment receipts and payments';
COMMENT ON TABLE billing_expenses IS 'Business expenses';
COMMENT ON TABLE billing_quotations IS 'Sales quotations/estimates';
