-- 1. Create expenses table if it doesn't exist (Safety check)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  category TEXT NOT NULL,
  vendor_name TEXT,
  amount NUMERIC NOT NULL,
  gst_amount NUMERIC DEFAULT 0,
  date DATE NOT NULL,
  payment_mode TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (using the helper function get_auth_company_id() defined in supabase_schema.sql)

-- Allow SELECT
CREATE POLICY "Users can view expenses in their company" ON expenses
  FOR SELECT USING (company_id = get_auth_company_id());

-- Allow INSERT
CREATE POLICY "Users can insert expenses for their company" ON expenses
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());

-- Allow UPDATE
CREATE POLICY "Users can update expenses in their company" ON expenses
  FOR UPDATE USING (company_id = get_auth_company_id());

-- Allow DELETE (Soft delete actually uses UPDATE rule, but if hard delete is needed)
CREATE POLICY "Users can delete expenses in their company" ON expenses
  FOR DELETE USING (company_id = get_auth_company_id());
