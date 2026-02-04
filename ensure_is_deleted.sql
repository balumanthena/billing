-- Migration: Ensure Soft Delete Support

-- Add is_deleted column if it doesn't exist
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_invoices_is_deleted ON public.invoices(is_deleted);
