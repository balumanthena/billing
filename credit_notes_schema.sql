-- Credit Notes Module Schema

-- 1. Create Credit Notes Table
CREATE TABLE credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  invoice_id UUID REFERENCES invoices(id) NOT NULL,
  
  cn_number TEXT NOT NULL, -- e.g. CN/24-25/001
  date DATE NOT NULL,
  reason TEXT, -- "Sales Return", "Discount", "Correction"
  
  -- Totals
  subtotal NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  
  -- Snapshots
  customer_snapshot JSONB,
  company_snapshot JSONB,
  
  status TEXT DEFAULT 'issued', -- Credit Notes are usually direct, but can be draft if needed.
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, cn_number)
);

-- 2. Create Credit Note Items Table
CREATE TABLE credit_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID REFERENCES credit_notes(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id), -- Optional, might be ad-hoc
  
  description TEXT NOT NULL,
  sac_code TEXT,
  
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  
  -- Tax Logic
  tax_rate NUMERIC NOT NULL,
  taxable_amount NUMERIC NOT NULL,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL
);

-- 3. Add Cancel Reason to Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- 4. Enable RLS
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_note_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Credit Notes
CREATE POLICY "Users can view credit_notes in their company" ON credit_notes
  FOR SELECT USING (company_id = get_auth_company_id());
  
CREATE POLICY "Users can insert credit_notes in their company" ON credit_notes
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());

-- Credit Note Items
CREATE POLICY "Users can view credit_note_items in their company" ON credit_note_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM credit_notes cn 
      WHERE cn.id = credit_note_items.credit_note_id 
      AND cn.company_id = get_auth_company_id()
    )
  );
  
CREATE POLICY "Users can insert credit_note_items in their company" ON credit_note_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM credit_notes cn 
      WHERE cn.id = credit_note_items.credit_note_id 
      AND cn.company_id = get_auth_company_id()
    )
  );
