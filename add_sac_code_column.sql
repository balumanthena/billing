ALTER TABLE master_invoices
ADD COLUMN sac_code TEXT;

COMMENT ON COLUMN master_invoices.sac_code IS 'Service Accounting Code for the master contract';
