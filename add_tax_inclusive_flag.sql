-- Migration: Add Tax Inclusive Support

-- 1. Add column to master_invoices
ALTER TABLE public.master_invoices 
ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT FALSE;

-- 2. Add column to invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT FALSE;
