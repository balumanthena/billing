-- Add Receipt fields to Payments table

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_mode TEXT; -- To store mode snapshot if needed, though 'mode' exists
-- Check if 'mode' is sufficient. Existing 'mode' is TEXT.

-- Optional: Create a sequence for receipt numbers if not handling via UUID or App Logic
-- We will handle "RCPT-YYYY-XXXX" logic in the application to ensure format control, 
-- but ensuring uniqueness via DB constraint (added above) is good.

-- We might want to backfill existing payments?
-- UPDATE payments SET receipt_number = 'RCPT-OLD-' || id WHERE receipt_number IS NULL;
