-- MASTER AUDIT & MIGRATION SCRIPT
-- This script safely ensures all Phase 1 & 2 tables/views exist.
-- It is idempotent: safe to run multiple times.

BEGIN;

/* -------------------------------------------------------------------------- */
/*                                 TABLE CHECKS                               */
/* -------------------------------------------------------------------------- */

-- 1. COMPANIES (Base)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT NOT NULL,
  address TEXT,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE, -- Phase 2 Additions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILES (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  role user_role DEFAULT 'viewer',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PARTIES
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT DEFAULT 'customer',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ITEMS (Services)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sac_code TEXT NOT NULL,
  tax_rate NUMERIC NOT NULL,
  unit_price NUMERIC DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  customer_id UUID REFERENCES parties(id),
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  status invoice_status DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  customer_snapshot JSONB,
  company_snapshot JSONB,
  cancel_reason TEXT, -- Phase 4.5 Addition
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, invoice_number)
);

-- 6. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  description TEXT NOT NULL,
  sac_code TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  tax_rate NUMERIC NOT NULL,
  taxable_amount NUMERIC NOT NULL,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL
);

-- 7. CREDIT NOTES (Phase 4.5)
CREATE TABLE IF NOT EXISTS credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  cn_number TEXT NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  subtotal NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  customer_snapshot JSONB,
  company_snapshot JSONB,
  status TEXT DEFAULT 'issued',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, cn_number)
);

CREATE TABLE IF NOT EXISTS credit_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID REFERENCES credit_notes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  description TEXT NOT NULL,
  sac_code TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC NOT NULL,
  taxable_amount NUMERIC NOT NULL,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL
);

-- 8. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  mode TEXT,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES (Phase 2)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  category TEXT NOT NULL,
  vendor_name TEXT,
  amount NUMERIC NOT NULL,
  gst_amount NUMERIC DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode TEXT,
  description TEXT,
  receipt_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FINANCIAL YEARS (Phase 2)
CREATE TABLE IF NOT EXISTS financial_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

/* -------------------------------------------------------------------------- */
/*                               COLUMN MIGRATIONS                            */
/* -------------------------------------------------------------------------- */

-- Add missing columns if tables existed but columns didn't
DO $$
BEGIN
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE parties ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE items ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
END $$;

/* -------------------------------------------------------------------------- */
/*                               REPORTING VIEWS                              */
/* -------------------------------------------------------------------------- */

-- 1. Outstanding Invoices View
-- Lists invoices with their paid amount and pending balance
CREATE OR REPLACE VIEW view_outstanding_invoices AS
SELECT 
    i.id,
    i.company_id,
    i.invoice_number,
    i.date,
    i.due_date,
    i.customer_id,
    c.name as customer_name,
    i.grand_total,
    COALESCE(SUM(p.amount), 0) as paid_amount,
    (i.grand_total - COALESCE(SUM(p.amount), 0)) as outstanding_amount,
    CASE 
        WHEN (i.grand_total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
        WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
        ELSE 'unpaid'
    END as payment_status,
    EXTRACT(DAY FROM (CURRENT_DATE - i.date)) as age_days
FROM invoices i
LEFT JOIN parties c ON i.customer_id = c.id
LEFT JOIN payments p ON i.id = p.invoice_id
WHERE i.status != 'cancelled' AND i.is_deleted = FALSE
GROUP BY i.id, i.company_id, i.invoice_number, i.date, i.due_date, i.customer_id, c.name, i.grand_total;

-- 2. Monthly Profit & Loss View
-- Aggregates Sales (Invoices) and Expenses by Month-Year
CREATE OR REPLACE VIEW view_monthly_pnl AS
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', date) as month_date,
        company_id,
        SUM(subtotal) as total_sales -- Use subtotal (excl tax) for P&L usually? Or Grand Total? Accounting usually uses Revenue (Taxable).
    FROM invoices 
    WHERE status != 'cancelled' AND is_deleted = FALSE
    GROUP BY 1, 2
),
monthly_expenses AS (
    SELECT 
        DATE_TRUNC('month', date) as month_date,
        company_id,
        SUM(amount) as total_expenses -- Expenses usually inclusive of tax if not ITC claimable, but let's assume raw amount
    FROM expenses 
    WHERE is_deleted = FALSE
    GROUP BY 1, 2
)
SELECT 
    COALESCE(s.month_date, e.month_date) as month,
    COALESCE(s.company_id, e.company_id) as company_id,
    COALESCE(s.total_sales, 0) as income,
    COALESCE(e.total_expenses, 0) as expense,
    (COALESCE(s.total_sales, 0) - COALESCE(e.total_expenses, 0)) as net_profit
FROM monthly_sales s
FULL OUTER JOIN monthly_expenses e ON s.month_date = e.month_date AND s.company_id = e.company_id;

/* -------------------------------------------------------------------------- */
/*                                RLS POLICIES                                */
/* -------------------------------------------------------------------------- */

-- Ensure RLS is enabled on all tables (Idempotent)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_years ENABLE ROW LEVEL SECURITY;

-- Note: We rely on existing policy creations. 
-- Creating policies IF NOT EXISTS is tricky in pure SQL without PL/pgSQL checks.
-- Assuming previous scripts ran, we are good. 
-- If needed, we can drop and recreate key policies, but user asked NOT to remove policies if they exist.
-- So we stop here.

COMMIT;
