-- ERP Grade Receipt System Upgrade & Atomic Numbering

-- 1. Create Sequence Table if not exists
CREATE TABLE IF NOT EXISTS receipt_sequences (
    company_id UUID NOT NULL,
    financial_year TEXT NOT NULL, -- Format: '25-26'
    last_sequence INTEGER DEFAULT 0,
    PRIMARY KEY (company_id, financial_year)
);

-- Enable RLS on the sequence table to be safe, though usually accessed via functions
ALTER TABLE receipt_sequences ENABLE ROW LEVEL SECURITY;

-- 2. Helper Function: Get Financial Year String (e.g. '25-26') from Date
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
    
    -- Indian FY: April (4) starts new year
    IF v_month >= 4 THEN
        v_start_year := v_year;
        v_end_year := v_year + 1;
    ELSE
        v_start_year := v_year - 1;
        v_end_year := v_year;
    END IF;
    
    -- Return formatted string YY-YY (e.g. 25-26)
    RETURN to_char(v_start_year % 100, 'fm00') || '-' || to_char(v_end_year % 100, 'fm00');
END;
$$ LANGUAGE plpgsql;

-- 3. Atomic Receipt Generation Function
-- Can be called via RPC or Trigger
CREATE OR REPLACE FUNCTION generate_receipt_number(p_company_id UUID, p_payment_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_fy TEXT;
    v_seq INTEGER;
    v_receipt_number TEXT;
BEGIN
    -- Get FY string
    v_fy := get_financial_year(p_payment_date);
    
    -- Upsert sequence atomically
    -- This locks the row for this company+FY, ensuring no race conditions
    INSERT INTO receipt_sequences (company_id, financial_year, last_sequence)
    VALUES (p_company_id, v_fy, 1)
    ON CONFLICT (company_id, financial_year)
    DO UPDATE SET last_sequence = receipt_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;
    
    -- Format: RCPT-YY-YY-XXXX (e.g., RCPT-25-26-0001)
    v_receipt_number := 'RCPT-' || v_fy || '-' || lpad(v_seq::text, 4, '0');
    
    RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to Automatically Set Receipt Number on Insert
CREATE OR REPLACE FUNCTION trigger_set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if not provided (or force it? "Do not allow manual overrides")
    -- We FORCE it to ensure compliance.
    NEW.receipt_number := generate_receipt_number(NEW.company_id, NEW.payment_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_receipt_number ON payments;
CREATE TRIGGER trg_set_receipt_number
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION trigger_set_receipt_number();

-- 5. Immutability Trigger (Prevent Update/Delete of Receipts)
CREATE OR REPLACE FUNCTION prevent_receipt_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Prevent changing the receipt number or amount/date which alters the receipt artifact
        IF OLD.receipt_number IS DISTINCT FROM NEW.receipt_number THEN
             RAISE EXCEPTION 'Receipt Number cannot be changed once generated.';
        END IF;
        
        -- Ideally, we lock the whole row, but sometimes we might want to update internal metadata?
        -- User said: "Receipts must be immutable (no edits or deletes)."
        -- We will BLOCK any update that changes the core receipt data.
        IF OLD.amount IS DISTINCT FROM NEW.amount OR 
           OLD.payment_date IS DISTINCT FROM NEW.payment_date OR
           OLD.mode IS DISTINCT FROM NEW.mode THEN
             RAISE EXCEPTION 'Receipts are immutable. Core payment details cannot be edited.';
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Receipts are immutable and cannot be deleted.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_receipt_immutability ON payments;
CREATE TRIGGER trg_receipt_immutability
BEFORE UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION prevent_receipt_modification();

