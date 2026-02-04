-- Add tax_mode column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_mode text DEFAULT 'exclusive';

-- Comment on column
COMMENT ON COLUMN invoices.tax_mode IS 'Tax calculation mode: exclusive (add tax) or inclusive (extract tax)';
