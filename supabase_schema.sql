-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'accountant', 'viewer');
CREATE TYPE invoice_status AS ENUM ('draft', 'finalized', 'cancelled');

-- TABLES

-- 1. Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT NOT NULL,
  address TEXT,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL, -- 2 digit code e.g., "29"
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 2. User Profiles (Auth & RBAC)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  full_name TEXT,
  role user_role DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Parties (Customers/Vendors)
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  state TEXT NOT NULL,
  state_code TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  type TEXT DEFAULT 'customer', -- 'customer' or 'vendor'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- 4. items (Services/Products)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sac_code TEXT NOT NULL, -- SAC/HSN
  tax_rate NUMERIC NOT NULL, -- 0, 5, 12, 18, 28
  unit_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 5. Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  customer_id UUID REFERENCES parties(id),
  invoice_number TEXT NOT NULL, -- e.g. INV/24-25/001
  date DATE NOT NULL,
  due_date DATE,
  status invoice_status DEFAULT 'draft',
  
  -- Calculated Totals
  subtotal NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  
  -- Snapshots (CRITICAL for audit)
  customer_snapshot JSONB, -- Stores name, address, GSTIN at time of invoice
  company_snapshot JSONB, -- Stores company details at time of invoice
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- 6. Invoice Line Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id),
  
  description TEXT NOT NULL,
  sac_code TEXT,
  
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  
  -- Tax Logic Per Item
  tax_rate NUMERIC NOT NULL, -- The % applied
  taxable_amount NUMERIC NOT NULL, -- (qty * price) - discount
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL -- taxable + taxes
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- 7. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  mode TEXT, -- Cash, UPI, NEFT
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES (Simple version: Users can see data if they belong to the company)
-- Note: This requires a mechanism to check user's company_id from auth.uid()
-- A helper function or view is usually best.

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS UUID AS $$
DECLARE
  company_id UUID;
BEGIN
  SELECT p.company_id INTO company_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for Companies: Users can read their own company
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (id = get_auth_company_id());

-- Policy for Profiles: Users can view profiles in their company
CREATE POLICY "Users can view profiles in their company" ON profiles
  FOR SELECT USING (company_id = get_auth_company_id());
  
-- Policy for Parties
CREATE POLICY "Users can view parties in their company" ON parties
  FOR SELECT USING (company_id = get_auth_company_id());
CREATE POLICY "Users can insert parties for their company" ON parties
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());
CREATE POLICY "Users can update parties in their company" ON parties
  FOR UPDATE USING (company_id = get_auth_company_id());

-- Policy for Items
CREATE POLICY "Users can view items in their company" ON items
  FOR SELECT USING (company_id = get_auth_company_id());
CREATE POLICY "Users can insert items for their company" ON items
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());
CREATE POLICY "Users can update items in their company" ON items
  FOR UPDATE USING (company_id = get_auth_company_id());

-- Policy for Invoices
CREATE POLICY "Users can view invoices in their company" ON invoices
  FOR SELECT USING (company_id = get_auth_company_id());
CREATE POLICY "Users can insert invoices for their company" ON invoices
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());
CREATE POLICY "Users can update invoices in their company" ON invoices
  FOR UPDATE USING (company_id = get_auth_company_id());

-- Invoice Items (inherited access via invoice probably, but explicit is safer)
-- Since invoice_items doesn't have company_id, we need to check via invoice.
-- Ideally we add company_id to invoice_items for easier RLS, OR use a join.
-- For MVP/Performance, adding company_id to all child tables is often recommended, 
-- but let's do a join check for correctness without denormalization for now:
CREATE POLICY "Users can view invoice_items in their company" ON invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_items.invoice_id 
      AND i.company_id = get_auth_company_id()
    )
  );

CREATE POLICY "Users can insert invoice_items in their company" ON invoice_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i 
      WHERE i.id = invoice_items.invoice_id 
      AND i.company_id = get_auth_company_id()
    )
  );

-- Policy for Payments
CREATE POLICY "Users can view payments in their company" ON payments
  FOR SELECT USING (company_id = get_auth_company_id());
CREATE POLICY "Users can insert payments for their company" ON payments
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());
