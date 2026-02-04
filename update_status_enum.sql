-- Add new statuses to the enum
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction block in some postgres versions, 
-- but Supabase SQL editor usually handles it. 
-- We'll try adding them safely.

ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'partially_paid';

-- Ensure payments table has the columns (in case previous step failed or wasn't run)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number TEXT UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id TEXT;
