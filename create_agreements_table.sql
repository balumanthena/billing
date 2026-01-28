-- Create Agreements Table
CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  customer_id UUID REFERENCES parties(id) NOT NULL,
  
  agreement_number TEXT, -- Optional manual reference
  date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  status TEXT DEFAULT 'draft', -- draft, active, expired, terminated
  
  -- Financials
  grand_total NUMERIC DEFAULT 0,
  tax_mode TEXT DEFAULT 'exclusive', -- inclusive, exclusive
  
  -- JSONB for flexible schema of the agreement details
  project_settings JSONB, -- techStack, jurisdiction, totalPages, etc.
  services_snapshot JSONB, -- Array of line items frozen at time of agreement
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view agreements in their company" ON agreements
  FOR SELECT USING (company_id = get_auth_company_id());

CREATE POLICY "Users can insert agreements for their company" ON agreements
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());

CREATE POLICY "Users can update agreements in their company" ON agreements
  FOR UPDATE USING (company_id = get_auth_company_id());

CREATE POLICY "Users can delete agreements in their company" ON agreements
  FOR DELETE USING (company_id = get_auth_company_id());
