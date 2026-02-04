-- ERP Grade Invoice System Upgrade

-- 1. Create Invoice Sequence Table
CREATE TABLE IF NOT EXISTS invoice_sequences (
    company_id UUID NOT NULL,
    financial_year TEXT NOT NULL, -- Format: '25-26'
    last_sequence INTEGER DEFAULT 0,
    PRIMARY KEY (company_id, financial_year)
);

ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- 2. Reuse or Create Financial Year Function (idempotent)
CREATE OR REPLACE FUNCTION get_financial_year(p_date DATE) 
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_month INTEGER;
    v_start_year INTEGER;
    v_end_year INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM p_date);
    v_month := EXTRACT(MONTH FROM p_date);
    
    IF v_month >= 4 THEN
        v_start_year := v_year;
        v_end_year := v_year + 1;
    ELSE
        v_start_year := v_year - 1;
        v_end_year := v_year;
    END IF;
    
    RETURN to_char(v_start_year % 100, 'fm00') || '-' || to_char(v_end_year % 100, 'fm00');
END;
$$ LANGUAGE plpgsql;

-- 3. Atomic Invoice Number Generation Function
CREATE OR REPLACE FUNCTION generate_invoice_number(p_company_id UUID, p_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_fy TEXT;
    v_seq INTEGER;
    v_invoice_number TEXT;
BEGIN
    v_fy := get_financial_year(p_date);
    
    INSERT INTO invoice_sequences (company_id, financial_year, last_sequence)
    VALUES (p_company_id, v_fy, 1)
    ON CONFLICT (company_id, financial_year)
    DO UPDATE SET last_sequence = invoice_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;
    
    -- Format: INV-YY-YY-XXXX (e.g. INV-25-26-0001)
    v_invoice_number := 'INV-' || v_fy || '-' || lpad(v_seq::text, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to Auto-Set Invoice Number
CREATE OR REPLACE FUNCTION trigger_set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if passed as NULL or empty, or we can force it.
    -- To support "Draft" having a number? Or only Finalized?
    -- User wants "Atomic Numbering". Usually Drafts get a temp number or null.
    -- But request implies standardizing "INV-25-26-XXXX".
    -- Let's auto-generate on INSERT irrespective of status, ensuring global uniqueness.
    -- Modification: Only if not provided? Or override?
    -- Override to ensure strict formatting.
    
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' OR NEW.invoice_number NOT LIKE 'INV-%' THEN
        NEW.invoice_number := generate_invoice_number(NEW.company_id, NEW.date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices;
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION trigger_set_invoice_number();

-- 5. Immutability Trigger (Strict Lock for Issued Invoices)
CREATE OR REPLACE FUNCTION prevent_invoice_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Define "Locked" statuses
    IF OLD.status IN ('finalized', 'sent', 'paid', 'partially_paid') THEN
        
        IF TG_OP = 'DELETE' THEN
            -- Allow if it's strictly a soft-delete (update is_deleted)
            -- But this is a DELETE trigger.
            RAISE EXCEPTION 'Cannot delete a finalized invoice. Cancel it instead.';
        END IF;

        IF TG_OP = 'UPDATE' THEN
             -- Check if restricted fields are changing
             IF OLD.grand_total IS DISTINCT FROM NEW.grand_total OR
                OLD.invoice_number IS DISTINCT FROM NEW.invoice_number OR
                OLD.date IS DISTINCT FROM NEW.date THEN
                    RAISE EXCEPTION 'Cannot edit core details of a finalized invoice.';
             END IF;
             
             -- Allow status updates (e.g. paid), IsDeleted (soft delete), etc.
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_immutability ON invoices;
CREATE TRIGGER trg_invoice_immutability
BEFORE UPDATE OR DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION prevent_invoice_modification();
