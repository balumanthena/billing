-- Add TDS columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tds_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tds_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_receivable numeric DEFAULT 0;

-- Comments
COMMENT ON COLUMN invoices.tds_rate IS 'TDS Rate in percentage (e.g. 10 for 10%)';
COMMENT ON COLUMN invoices.tds_amount IS 'Calculated TDS Amount (Taxable Value * Rate%)';
COMMENT ON COLUMN invoices.net_receivable IS 'Grand Total - TDS Amount';
