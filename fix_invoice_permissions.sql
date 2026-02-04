-- FIX: Missing RLS Policies for Invoices table
-- Without these, DELETE and UPDATE operations might be blocked by default RLS deny.

-- Enable RLS (just in case)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 1. VIEW (Select)
DROP POLICY IF EXISTS "Users can view invoices for their company" ON public.invoices;
CREATE POLICY "Users can view invoices for their company"
ON public.invoices FOR SELECT
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 2. CREATE (Insert)
DROP POLICY IF EXISTS "Users can create invoices for their company" ON public.invoices;
CREATE POLICY "Users can create invoices for their company"
ON public.invoices FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 3. UPDATE (Edit/Soft Delete)
DROP POLICY IF EXISTS "Users can update invoices for their company" ON public.invoices;
CREATE POLICY "Users can update invoices for their company"
ON public.invoices FOR UPDATE
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 4. DELETE (Hard Delete)
DROP POLICY IF EXISTS "Users can delete invoices for their company" ON public.invoices;
CREATE POLICY "Users can delete invoices for their company"
ON public.invoices FOR DELETE
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Force cache reload
NOTIFY pgrst, 'reload config';
