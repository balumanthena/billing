-- Create master_invoices table
CREATE TABLE IF NOT EXISTS public.master_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    customer_id UUID NOT NULL REFERENCES public.parties(id),
    master_invoice_number TEXT NOT NULL,
    title TEXT,
    start_date DATE,
    end_date DATE,
    total_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    outstanding_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, master_invoice_number)
);

-- Add Master Invoice columns to invoices table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'master_invoice_id') THEN
        ALTER TABLE public.invoices ADD COLUMN master_invoice_id UUID REFERENCES public.master_invoices(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'phase_number') THEN
        ALTER TABLE public.invoices ADD COLUMN phase_number INT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'phase_label') THEN
        ALTER TABLE public.invoices ADD COLUMN phase_label TEXT;
    END IF;
END $$;

-- Enable RLS on master_invoices
ALTER TABLE public.master_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for master_invoices
DROP POLICY IF EXISTS "Users can view master invoices for their company" ON public.master_invoices;
CREATE POLICY "Users can view master invoices for their company"
ON public.master_invoices FOR SELECT
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can create master invoices for their company" ON public.master_invoices;
CREATE POLICY "Users can create master invoices for their company"
ON public.master_invoices FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update master invoices for their company" ON public.master_invoices;
CREATE POLICY "Users can update master invoices for their company"
ON public.master_invoices FOR UPDATE
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete master invoices for their company" ON public.master_invoices;
CREATE POLICY "Users can delete master invoices for their company"
ON public.master_invoices FOR DELETE
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Create Function to Recalculate Totals
CREATE OR REPLACE FUNCTION recalc_master_invoice_totals_for_id(target_master_id UUID) RETURNS VOID AS $$
DECLARE
    v_total_paid NUMERIC;
    v_total_grand NUMERIC;
BEGIN
    -- Calculate Sum of Grand Totals of all PHASES (child invoices)
    SELECT COALESCE(SUM(grand_total), 0) INTO v_total_grand
    FROM invoices
    WHERE master_invoice_id = target_master_id
    AND status != 'cancelled';

    -- Calculate Total Paid (from payments on those invoices)
    SELECT COALESCE(SUM(p.amount), 0) INTO v_total_paid
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    WHERE i.master_invoice_id = target_master_id;

    -- Update Master Invoice
    UPDATE master_invoices
    SET 
        total_amount = v_total_grand,
        paid_amount = v_total_paid,
        outstanding_amount = v_total_grand - v_total_paid,
        updated_at = NOW(),
        status = CASE 
            WHEN v_total_paid >= v_total_grand AND v_total_grand > 0 THEN 'completed'
            ELSE status -- Keep existing status (active) unless completed
        END
    WHERE id = target_master_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update master invoice when a child invoice changes
CREATE OR REPLACE FUNCTION trg_update_master_on_invoice_change() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        IF OLD.master_invoice_id IS NOT NULL THEN
            PERFORM recalc_master_invoice_totals_for_id(OLD.master_invoice_id);
        END IF;
    ELSE
        IF NEW.master_invoice_id IS NOT NULL THEN
            PERFORM recalc_master_invoice_totals_for_id(NEW.master_invoice_id);
        END IF;
        -- If master_invoice_id changed
        IF TG_OP = 'UPDATE' AND OLD.master_invoice_id IS NOT NULL AND OLD.master_invoice_id != NEW.master_invoice_id THEN
            PERFORM recalc_master_invoice_totals_for_id(OLD.master_invoice_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_invoice_master_update ON public.invoices;
CREATE TRIGGER trg_invoice_master_update
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION trg_update_master_on_invoice_change();

-- Trigger for Payments to update Master
CREATE OR REPLACE FUNCTION trg_update_master_on_payment_change() RETURNS TRIGGER AS $$
DECLARE
    v_master_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        SELECT master_invoice_id INTO v_master_id FROM invoices WHERE id = OLD.invoice_id;
        IF v_master_id IS NOT NULL THEN
            PERFORM recalc_master_invoice_totals_for_id(v_master_id);
        END IF;
    ELSE
        SELECT master_invoice_id INTO v_master_id FROM invoices WHERE id = NEW.invoice_id;
        IF v_master_id IS NOT NULL THEN
            PERFORM recalc_master_invoice_totals_for_id(v_master_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_master_update ON public.payments;
CREATE TRIGGER trg_payment_master_update
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION trg_update_master_on_payment_change();

-- Force schema cache reload (Supabase specific hint)
NOTIFY pgrst, 'reload config';
