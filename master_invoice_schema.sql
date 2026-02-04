-- MASTER INVOICE MODULE

-- 1. Create Master Invoices Table
CREATE TABLE master_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  customer_id UUID REFERENCES parties(id) NOT NULL,
  
  master_invoice_number TEXT NOT NULL, -- e.g. MI/24-25/001
  
  -- Contract Details
  title TEXT, -- e.g. "Annual IT Maintenance Contract 2024"
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Financials (Aggregated)
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC NOT NULL DEFAULT 0,
  
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, master_invoice_number)
);

-- 2. Modify Invoices Table to serve as Phase Invoices
ALTER TABLE invoices 
ADD COLUMN master_invoice_id UUID REFERENCES master_invoices(id) ON DELETE CASCADE,
ADD COLUMN phase_number INT, -- e.g. 1
ADD COLUMN phase_label TEXT; -- e.g. "Phase 1: Advance Payment"

-- 3. Enable RLS for master_invoices
ALTER TABLE master_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view master_invoices in their company" ON master_invoices
  FOR SELECT USING (company_id = get_auth_company_id());

CREATE POLICY "Users can insert master_invoices for their company" ON master_invoices
  FOR INSERT WITH CHECK (company_id = get_auth_company_id());

CREATE POLICY "Users can update master_invoices in their company" ON master_invoices
  FOR UPDATE USING (company_id = get_auth_company_id());

-- 4. Automatic Roll-up Trigger
-- When a payment is made on a CHILD invoice, update the PARENT master invoice.
-- Actually, easier to trigger on Invoice Changes if we store paid_amount on invoices,
-- BUT standard design usually tracks payments in a separate table.
-- Let's assume 'invoices' table has a calculated 'paid_amount' or we query the 'payments' table.

-- For simplicity and robustness, let's create a function to re-calculate Master Totals
CREATE OR REPLACE FUNCTION recalc_master_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_master_id UUID;
  v_total_paid NUMERIC;
  v_total_grand NUMERIC;
BEGIN
  -- Determine master_id based on context
  IF (TG_OP = 'DELETE') THEN
    v_master_id := OLD.master_invoice_id;
  ELSE
    v_master_id := NEW.master_invoice_id;
  END IF;

  -- If no master linked, exit
  IF v_master_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate Sum of Grand Totals of all PHASES
  SELECT COALESCE(SUM(grand_total), 0)
  INTO v_total_grand
  FROM invoices
  WHERE master_invoice_id = v_master_id
  AND status != 'cancelled';

  -- Calculate Total Paid (Sum of payments for all invoices linked to this master)
  -- This requires joining payments -> invoices -> master
  -- OR assuming invoices has a 'paid_amount' column. 
  
  -- Let's query payments directly for accuracy
  SELECT COALESCE(SUM(p.amount), 0)
  INTO v_total_paid
  FROM payments p
  JOIN invoices i ON i.id = p.invoice_id
  WHERE i.master_invoice_id = v_master_id;

  -- Update Master Invoice
  UPDATE master_invoices
  SET 
    total_amount = v_total_grand,
    paid_amount = v_total_paid,
    outstanding_amount = v_total_grand - v_total_paid,
    updated_at = NOW(),
    status = CASE 
      WHEN v_total_paid >= v_total_grand THEN 'completed'
      WHEN v_total_paid > 0 THEN 'active' -- or partial
      ELSE 'active' -- or pending
    END
  WHERE id = v_master_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger Attachments

-- Trigger A: When invoice amounts change (Invoice creation/update)
CREATE TRIGGER trg_update_master_on_invoice_change
AFTER INSERT OR UPDATE OF grand_total, status, master_invoice_id OR DELETE
ON invoices
FOR EACH ROW
EXECUTE FUNCTION recalc_master_invoice_totals();

-- Trigger B: When payments are made
-- We need a separate bridge trigger for payments because they don't have master_id directly.
CREATE OR REPLACE FUNCTION trigger_recalc_master_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_master_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  SELECT master_invoice_id INTO v_master_id FROM invoices WHERE id = v_invoice_id;
  
  IF v_master_id IS NOT NULL THEN
    -- We just need to fire the logic. We can call the function directly or trick it.
    -- Calling the logic:
    PERFORM recalc_master_invoice_totals_for_id(v_master_id);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Refactoring the main logic to be callable by ID to avoid code duplication
CREATE OR REPLACE FUNCTION recalc_master_invoice_totals_for_id(target_master_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_paid NUMERIC;
  v_total_grand NUMERIC;
BEGIN
  -- Calculate Sum of Grand Totals of all PHASES
  SELECT COALESCE(SUM(grand_total), 0)
  INTO v_total_grand
  FROM invoices
  WHERE master_invoice_id = target_master_id
  AND status != 'cancelled';

  -- Calculate Total Paid
  SELECT COALESCE(SUM(p.amount), 0)
  INTO v_total_paid
  FROM payments p
  JOIN invoices i ON i.id = p.invoice_id
  WHERE i.master_invoice_id = target_master_id;

  -- Update Master Invoice
  UPDATE master_invoices
  SET 
    total_amount = v_total_grand,
    paid_amount = v_total_paid,
    outstanding_amount = v_total_grand - v_total_paid,
    updated_at = NOW(),
    status = CASE 
      WHEN v_total_paid >= v_total_grand THEN 'completed'
      ELSE 'active'
    END
  WHERE id = target_master_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the Trigger Function A to use the new helper
CREATE OR REPLACE FUNCTION recalc_master_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    IF OLD.master_invoice_id IS NOT NULL THEN
      PERFORM recalc_master_invoice_totals_for_id(OLD.master_invoice_id);
    END IF;
  ELSE
    IF NEW.master_invoice_id IS NOT NULL THEN
      PERFORM recalc_master_invoice_totals_for_id(NEW.master_invoice_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger on Payments
CREATE TRIGGER trg_update_master_on_payment
AFTER INSERT OR UPDATE OF amount OR DELETE
ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_master_on_payment();
