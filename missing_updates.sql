-- Combined Missing Updates (Expenses + Party Fields)

-- 1. Setup Expenses Table and RLS (from fix_expenses_rls.sql)
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

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Helper to safely create policies only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view expenses in their company') THEN
        CREATE POLICY "Users can view expenses in their company" ON expenses
          FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert expenses for their company') THEN
        CREATE POLICY "Users can insert expenses for their company" ON expenses
          FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update expenses in their company') THEN
        CREATE POLICY "Users can update expenses in their company" ON expenses
          FOR UPDATE USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can delete expenses in their company') THEN
        CREATE POLICY "Users can delete expenses in their company" ON expenses
          FOR DELETE USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));
    END IF;
END $$;


-- 2. Add Missing Party Fields (from add_party_fields.sql)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS phone TEXT;
