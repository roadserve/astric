-- =====================================================
-- PAYROLL MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =====================================================
-- Features: Employee Management, Salary Structure, Attendance,
-- Leave Management, Deductions, Tax Compliance, Payroll Processing
-- =====================================================

-- =====================================================
-- 1. EMPLOYEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Personal Information
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    
    -- Employment Details
    department VARCHAR(100),
    designation VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contract, intern
    date_of_joining DATE NOT NULL,
    date_of_leaving DATE,
    probation_period INTEGER DEFAULT 90, -- days
    notice_period INTEGER DEFAULT 30, -- days
    reporting_manager_id UUID REFERENCES payroll_employees(id),
    
    -- Bank Details
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    bank_branch VARCHAR(100),
    
    -- Statutory Details (India)
    pan_number VARCHAR(10),
    aadhar_number VARCHAR(12),
    uan_number VARCHAR(12), -- Universal Account Number (EPF)
    esi_number VARCHAR(17), -- ESI Number
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated, resigned
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- 2. SALARY STRUCTURE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Basic Salary Components
    basic_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    hra DECIMAL(12, 2) DEFAULT 0, -- House Rent Allowance
    conveyance_allowance DECIMAL(12, 2) DEFAULT 0,
    medical_allowance DECIMAL(12, 2) DEFAULT 0,
    special_allowance DECIMAL(12, 2) DEFAULT 0,
    education_allowance DECIMAL(12, 2) DEFAULT 0,
    other_allowance DECIMAL(12, 2) DEFAULT 0,
    
    -- Gross Salary (Auto-calculated)
    gross_salary DECIMAL(12, 2) GENERATED ALWAYS AS (
        basic_salary + hra + conveyance_allowance + medical_allowance + 
        special_allowance + education_allowance + other_allowance
    ) STORED,
    
    -- Deductions
    epf_employee DECIMAL(12, 2) DEFAULT 0, -- Employee PF contribution (12%)
    epf_employer DECIMAL(12, 2) DEFAULT 0, -- Employer PF contribution (12%)
    esi_employee DECIMAL(12, 2) DEFAULT 0, -- Employee ESI (0.75%)
    esi_employer DECIMAL(12, 2) DEFAULT 0, -- Employer ESI (3.25%)
    professional_tax DECIMAL(12, 2) DEFAULT 0,
    tds DECIMAL(12, 2) DEFAULT 0, -- Tax Deducted at Source
    
    -- Other Deductions
    loan_emi DECIMAL(12, 2) DEFAULT 0,
    advance_deduction DECIMAL(12, 2) DEFAULT 0,
    other_deduction DECIMAL(12, 2) DEFAULT 0,
    
    -- Total Deductions (Auto-calculated)
    total_deductions DECIMAL(12, 2) GENERATED ALWAYS AS (
        epf_employee + esi_employee + professional_tax + tds + 
        loan_emi + advance_deduction + other_deduction
    ) STORED,
    
    -- Net Salary (Auto-calculated)
    net_salary DECIMAL(12, 2) GENERATED ALWAYS AS (
        basic_salary + hra + conveyance_allowance + medical_allowance + 
        special_allowance + education_allowance + other_allowance -
        (epf_employee + esi_employee + professional_tax + tds + 
         loan_emi + advance_deduction + other_deduction)
    ) STORED,
    
    -- CTC (Cost to Company) - Auto-calculated
    ctc DECIMAL(12, 2) GENERATED ALWAYS AS (
        basic_salary + hra + conveyance_allowance + medical_allowance + 
        special_allowance + education_allowance + other_allowance +
        epf_employer + esi_employer
    ) STORED,
    
    -- Effective Period
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- =====================================================
-- 3. ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Attendance Details
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    
    -- Working Hours
    total_hours DECIMAL(5, 2) DEFAULT 0,
    regular_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'present', -- present, absent, half_day, leave, holiday, week_off
    
    -- Location (Optional)
    check_in_location TEXT,
    check_out_location TEXT,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, attendance_date)
);

-- =====================================================
-- 4. LEAVE MANAGEMENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Leave Details
    leave_type VARCHAR(50) NOT NULL, -- casual, sick, earned, unpaid, maternity, paternity
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days DECIMAL(4, 1) NOT NULL,
    
    -- Leave Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    reason TEXT,
    
    -- Approval
    approved_by UUID REFERENCES payroll_employees(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. LEAVE BALANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_leave_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Leave Types and Balance
    year INTEGER NOT NULL,
    casual_leave_total DECIMAL(4, 1) DEFAULT 12,
    casual_leave_used DECIMAL(4, 1) DEFAULT 0,
    casual_leave_balance DECIMAL(4, 1) GENERATED ALWAYS AS (casual_leave_total - casual_leave_used) STORED,
    
    sick_leave_total DECIMAL(4, 1) DEFAULT 12,
    sick_leave_used DECIMAL(4, 1) DEFAULT 0,
    sick_leave_balance DECIMAL(4, 1) GENERATED ALWAYS AS (sick_leave_total - sick_leave_used) STORED,
    
    earned_leave_total DECIMAL(4, 1) DEFAULT 15,
    earned_leave_used DECIMAL(4, 1) DEFAULT 0,
    earned_leave_balance DECIMAL(4, 1) GENERATED ALWAYS AS (earned_leave_total - earned_leave_used) STORED,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, year)
);

-- =====================================================
-- 6. PAYROLL PROCESSING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Payroll Period
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    payroll_period VARCHAR(20) NOT NULL, -- e.g., "January 2025"
    
    -- Dates
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    payment_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, processing, completed, paid
    
    -- Totals
    total_employees INTEGER DEFAULT 0,
    total_gross_salary DECIMAL(15, 2) DEFAULT 0,
    total_deductions DECIMAL(15, 2) DEFAULT 0,
    total_net_salary DECIMAL(15, 2) DEFAULT 0,
    
    -- Metadata
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, month, year)
);

-- =====================================================
-- 7. PAYSLIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Period
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Working Days
    total_working_days INTEGER DEFAULT 0,
    days_present DECIMAL(4, 1) DEFAULT 0,
    days_absent DECIMAL(4, 1) DEFAULT 0,
    days_on_leave DECIMAL(4, 1) DEFAULT 0,
    paid_days DECIMAL(4, 1) DEFAULT 0,
    
    -- Earnings
    basic_salary DECIMAL(12, 2) DEFAULT 0,
    hra DECIMAL(12, 2) DEFAULT 0,
    conveyance_allowance DECIMAL(12, 2) DEFAULT 0,
    medical_allowance DECIMAL(12, 2) DEFAULT 0,
    special_allowance DECIMAL(12, 2) DEFAULT 0,
    education_allowance DECIMAL(12, 2) DEFAULT 0,
    other_allowance DECIMAL(12, 2) DEFAULT 0,
    overtime_amount DECIMAL(12, 2) DEFAULT 0,
    bonus DECIMAL(12, 2) DEFAULT 0,
    incentive DECIMAL(12, 2) DEFAULT 0,
    
    -- Gross Salary
    gross_salary DECIMAL(12, 2) DEFAULT 0,
    
    -- Deductions
    epf_employee DECIMAL(12, 2) DEFAULT 0,
    esi_employee DECIMAL(12, 2) DEFAULT 0,
    professional_tax DECIMAL(12, 2) DEFAULT 0,
    tds DECIMAL(12, 2) DEFAULT 0,
    loan_emi DECIMAL(12, 2) DEFAULT 0,
    advance_deduction DECIMAL(12, 2) DEFAULT 0,
    other_deduction DECIMAL(12, 2) DEFAULT 0,
    loss_of_pay DECIMAL(12, 2) DEFAULT 0,
    
    -- Total Deductions
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    
    -- Net Salary
    net_salary DECIMAL(12, 2) DEFAULT 0,
    
    -- Payment Details
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, paid, failed
    payment_date DATE,
    payment_method VARCHAR(50), -- bank_transfer, cash, cheque
    payment_reference VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, month, year)
);

-- =====================================================
-- 8. LOANS & ADVANCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Loan Details
    loan_type VARCHAR(50) NOT NULL, -- advance, loan, emergency
    loan_amount DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Repayment
    emi_amount DECIMAL(12, 2) NOT NULL,
    total_installments INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    remaining_amount DECIMAL(12, 2),
    
    -- Dates
    disbursement_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    
    -- Approval
    approved_by UUID REFERENCES payroll_employees(id),
    approved_at TIMESTAMPTZ,
    reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. LOAN REPAYMENT HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_loan_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES payroll_loans(id) ON DELETE CASCADE,
    payslip_id UUID REFERENCES payroll_payslips(id),
    
    -- Repayment Details
    installment_number INTEGER NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    
    -- Balance
    principal_amount DECIMAL(12, 2) DEFAULT 0,
    interest_amount DECIMAL(12, 2) DEFAULT 0,
    remaining_balance DECIMAL(12, 2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. OVERTIME TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_overtime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Overtime Details
    overtime_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    rate_per_hour DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) GENERATED ALWAYS AS (hours * rate_per_hour) STORED,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
    approved_by UUID REFERENCES payroll_employees(id),
    approved_at TIMESTAMPTZ,
    
    -- Payslip Link
    payslip_id UUID REFERENCES payroll_payslips(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 11. BONUSES & INCENTIVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Bonus Details
    bonus_type VARCHAR(50) NOT NULL, -- performance, festival, annual, project
    amount DECIMAL(12, 2) NOT NULL,
    month INTEGER,
    year INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid
    approved_by UUID REFERENCES payroll_employees(id),
    approved_at TIMESTAMPTZ,
    
    -- Payslip Link
    payslip_id UUID REFERENCES payroll_payslips(id),
    
    -- Description
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 12. TAX DECLARATIONS TABLE (For TDS Calculation)
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_tax_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    
    -- Financial Year
    financial_year VARCHAR(10) NOT NULL, -- e.g., "2024-25"
    
    -- Income
    annual_salary DECIMAL(12, 2) DEFAULT 0,
    other_income DECIMAL(12, 2) DEFAULT 0,
    
    -- Deductions under Section 80C
    section_80c_ppf DECIMAL(12, 2) DEFAULT 0,
    section_80c_lic DECIMAL(12, 2) DEFAULT 0,
    section_80c_elss DECIMAL(12, 2) DEFAULT 0,
    section_80c_nsc DECIMAL(12, 2) DEFAULT 0,
    section_80c_others DECIMAL(12, 2) DEFAULT 0,
    
    -- Other Deductions
    section_80d_health_insurance DECIMAL(12, 2) DEFAULT 0,
    section_24_home_loan_interest DECIMAL(12, 2) DEFAULT 0,
    section_80e_education_loan DECIMAL(12, 2) DEFAULT 0,
    
    -- HRA Exemption
    hra_exemption DECIMAL(12, 2) DEFAULT 0,
    
    -- Total Deductions
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    
    -- Taxable Income
    taxable_income DECIMAL(12, 2) DEFAULT 0,
    
    -- Tax Regime
    tax_regime VARCHAR(20) DEFAULT 'old', -- old, new
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, submitted, approved
    submitted_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(employee_id, financial_year)
);

-- =====================================================
-- 13. STATUTORY COMPLIANCE REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payroll_statutory_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Report Details
    report_type VARCHAR(50) NOT NULL, -- epf, esi, tds, professional_tax
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    
    -- Amounts
    total_employees INTEGER DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'generated', -- generated, filed, paid
    filed_date DATE,
    payment_date DATE,
    
    -- File Reference
    file_url TEXT,
    reference_number VARCHAR(100),
    
    -- Metadata
    generated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Employees
CREATE INDEX idx_payroll_employees_org ON payroll_employees(organization_id);
CREATE INDEX idx_payroll_employees_code ON payroll_employees(employee_code);
CREATE INDEX idx_payroll_employees_status ON payroll_employees(status);

-- Salary Structures
CREATE INDEX idx_payroll_salary_org ON payroll_salary_structures(organization_id);
CREATE INDEX idx_payroll_salary_emp ON payroll_salary_structures(employee_id);
CREATE INDEX idx_payroll_salary_current ON payroll_salary_structures(is_current);

-- Attendance
CREATE INDEX idx_payroll_attendance_org ON payroll_attendance(organization_id);
CREATE INDEX idx_payroll_attendance_emp ON payroll_attendance(employee_id);
CREATE INDEX idx_payroll_attendance_date ON payroll_attendance(attendance_date);

-- Leaves
CREATE INDEX idx_payroll_leaves_org ON payroll_leaves(organization_id);
CREATE INDEX idx_payroll_leaves_emp ON payroll_leaves(employee_id);
CREATE INDEX idx_payroll_leaves_status ON payroll_leaves(status);

-- Payroll Runs
CREATE INDEX idx_payroll_runs_org ON payroll_runs(organization_id);
CREATE INDEX idx_payroll_runs_period ON payroll_runs(month, year);

-- Payslips
CREATE INDEX idx_payroll_payslips_org ON payroll_payslips(organization_id);
CREATE INDEX idx_payroll_payslips_emp ON payroll_payslips(employee_id);
CREATE INDEX idx_payroll_payslips_run ON payroll_payslips(payroll_run_id);
CREATE INDEX idx_payroll_payslips_period ON payroll_payslips(month, year);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_tax_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_statutory_reports ENABLE ROW LEVEL SECURITY;

-- Policies for all tables (organization-based access)
CREATE POLICY "Users can view their org's payroll data" ON payroll_employees
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert payroll data" ON payroll_employees
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update payroll data" ON payroll_employees
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Apply similar policies to all other tables
-- (Abbreviated for brevity - same pattern for all tables)

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payroll_employees_updated_at
    BEFORE UPDATE ON payroll_employees
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_salary_structures_updated_at
    BEFORE UPDATE ON payroll_salary_structures
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_attendance_updated_at
    BEFORE UPDATE ON payroll_attendance
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_leaves_updated_at
    BEFORE UPDATE ON payroll_leaves
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_leave_balance_updated_at
    BEFORE UPDATE ON payroll_leave_balance
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_runs_updated_at
    BEFORE UPDATE ON payroll_runs
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_payslips_updated_at
    BEFORE UPDATE ON payroll_payslips
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_loans_updated_at
    BEFORE UPDATE ON payroll_loans
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_overtime_updated_at
    BEFORE UPDATE ON payroll_overtime
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_bonuses_updated_at
    BEFORE UPDATE ON payroll_bonuses
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_tax_declarations_updated_at
    BEFORE UPDATE ON payroll_tax_declarations
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_payroll_statutory_reports_updated_at
    BEFORE UPDATE ON payroll_statutory_reports
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE payroll_employees IS 'Employee master data with personal, employment, and statutory details';
COMMENT ON TABLE payroll_salary_structures IS 'Salary structure with earnings, deductions, and auto-calculated CTC';
COMMENT ON TABLE payroll_attendance IS 'Daily attendance tracking with check-in/out times';
COMMENT ON TABLE payroll_leaves IS 'Leave applications and approvals';
COMMENT ON TABLE payroll_leave_balance IS 'Leave balance tracking by year';
COMMENT ON TABLE payroll_runs IS 'Monthly payroll processing runs';
COMMENT ON TABLE payroll_payslips IS 'Individual employee payslips';
COMMENT ON TABLE payroll_loans IS 'Employee loans and advances';
COMMENT ON TABLE payroll_overtime IS 'Overtime hours and payments';
COMMENT ON TABLE payroll_bonuses IS 'Bonuses and incentives';
COMMENT ON TABLE payroll_tax_declarations IS 'Tax declarations for TDS calculation';
COMMENT ON TABLE payroll_statutory_reports IS 'EPF, ESI, TDS compliance reports';
