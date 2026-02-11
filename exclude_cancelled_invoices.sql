-- 1. Create View for Active Invoices (Excluding Draft and Cancelled)
-- 'issued' is acceptable alias for 'finalized' in business logic, but DB uses 'finalized'.
-- We include 'paid' and 'partially_paid' as they are valid financial states.
CREATE OR REPLACE VIEW active_invoices AS
SELECT * FROM invoices
WHERE status IN ('finalized', 'paid', 'partially_paid');

-- 2. Add CHECK constraint to ensure status integrity (if not exists)
-- This prevents accidental insertion of invalid statuses not in enum, 
-- though Postgres Enum type usually handles this.
-- We'll add a check that ensures status is one of the allowed types.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'invoices_status_check'
    ) THEN
        ALTER TABLE invoices
        ADD CONSTRAINT invoices_status_check
        CHECK (status IN ('draft', 'finalized', 'paid', 'partially_paid', 'cancelled'));
    END IF;
END $$;

-- 3. Comments for documentation
COMMENT ON VIEW active_invoices IS 'View of all issued/finalized invoices that should be included in financial reports. Excludes drafts and cancelled invoices.';
