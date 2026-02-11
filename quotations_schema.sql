-- QUOTATIONS MODULE SCHEMA

-- 1. Create Enums
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted');
CREATE TYPE pricing_model_type AS ENUM ('fixed', 'retainer', 'usage_based', 'percentage', 'hybrid');

-- 2. Create Quotations Table
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  quotation_number TEXT NOT NULL,
  client_id UUID REFERENCES parties(id) NOT NULL,
  
  -- Project Details
  project_title TEXT NOT NULL,
  scope_of_work TEXT,
  currency TEXT DEFAULT 'INR',
  pricing_model pricing_model_type DEFAULT 'fixed',
  
  -- Financials
  subtotal NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0, -- GST Amount
  discount_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  
  -- Validity & Metadata
  valid_until DATE,
  version INT DEFAULT 1,
  status quotation_status DEFAULT 'draft',
  
  -- Foreign Keys to Converted Objects (for tracking)
  converted_agreement_id UUID REFERENCES agreements(id),
  converted_invoice_id UUID REFERENCES invoices(id),
  
  -- Timestamps
  created_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, quotation_number)
);

-- 3. Create Quotation Items Table
CREATE TABLE quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES items(id), -- Optional link to service catalog
  
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  
  -- Additional Metadata for SaaS
  item_type TEXT DEFAULT 'service', -- service, custom, retainer
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Activity Log (Audit)
CREATE TABLE quotation_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- created, sent, approved, converted, etc.
  performed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_activity_log ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Quotations
CREATE POLICY "Users can view quotations in their company" ON quotations
  FOR SELECT USING (company_id = get_auth_company_id());
  
CREATE POLICY "Users can insert quotations for their company" ON quotations
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());
  
CREATE POLICY "Users can update quotations in their company" ON quotations
  FOR UPDATE USING (company_id = get_auth_company_id());

CREATE POLICY "Users can delete DRAFT quotations in their company" ON quotations
  FOR DELETE USING (
    company_id = get_auth_company_id() 
    AND status = 'draft'
  );

-- Quotation Items
CREATE POLICY "Users can view quotation_items in their company" ON quotation_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND q.company_id = get_auth_company_id()
    )
  );

CREATE POLICY "Users can manage quotation_items" ON quotation_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_items.quotation_id
      AND q.company_id = get_auth_company_id()
    )
  );

-- Activity Log
CREATE POLICY "Users can view activity logs" ON quotation_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotation_activity_log.quotation_id
      AND q.company_id = get_auth_company_id()
    )
  );

-- 7. Trigger for Updated At
CREATE OR REPLACE FUNCTION update_quotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_update_quotation_timestamp
BEFORE UPDATE ON quotations
FOR EACH ROW
EXECUTE FUNCTION update_quotation_timestamp();

-- 8. Comments
COMMENT ON TABLE quotations IS 'Master table for project quotations. Does NOT affect financial reports.';
