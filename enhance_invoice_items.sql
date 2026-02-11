-- Migration: Enhance invoice_items for Phase and Service tracking

ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS service_id UUID,
ADD COLUMN IF NOT EXISTS service_name TEXT,
ADD COLUMN IF NOT EXISTS phase_id UUID,
ADD COLUMN IF NOT EXISTS phase_number INTEGER,
ADD COLUMN IF NOT EXISTS phase_name TEXT,
ADD COLUMN IF NOT EXISTS phase_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS agreement_id UUID;

-- Ensure sac_code exists (it might already from previous migrations, but safe to check)
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS sac_code TEXT;

-- Add usage comments
COMMENT ON COLUMN invoice_items.service_name IS 'Snapshot of the service name at time of invoice creation';
COMMENT ON COLUMN invoice_items.phase_number IS 'Sequence number of the phase (e.g. 1, 2, 3)';
COMMENT ON COLUMN invoice_items.phase_name IS 'Label of the phase (e.g. Advance, Milestone, Final)';
COMMENT ON COLUMN invoice_items.phase_percentage IS 'Percentage of the total contract value this phase represents';
