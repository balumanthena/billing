-- FIX: Add 'sent' to invoice_status enum
-- The application seems to use 'sent' in some flows (or triggers), so it must be valid.

ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'overdue';
