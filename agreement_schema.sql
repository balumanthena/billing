-- 1. Create Agreement Phases Table
CREATE TABLE IF NOT EXISTS public.agreement_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    sequence INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_invoiced', 'fully_invoiced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.agreement_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view phases of their company" ON public.agreement_phases
    FOR SELECT USING (
        agreement_id IN (
            SELECT id FROM public.agreements WHERE company_id IN (
                SELECT company_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert phases" ON public.agreement_phases
    FOR INSERT WITH CHECK (true); -- Simplified, rely on application logic for auth check on agreement_id

CREATE POLICY "Users can update phases" ON public.agreement_phases
    FOR UPDATE USING (true);


-- 2. Update Agreements Table
DO $$ 
BEGIN 
    -- GST Rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'gst_rate') THEN
        ALTER TABLE public.agreements ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 18.0;
    END IF;

    -- TDS Rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'tds_rate') THEN
        ALTER TABLE public.agreements ADD COLUMN tds_rate DECIMAL(5,2) DEFAULT 0.0;
    END IF;

    -- Billing Address (Snapshot)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agreements' AND column_name = 'billing_address') THEN
        ALTER TABLE public.agreements ADD COLUMN billing_address JSONB;
    END IF;
END $$;


-- 3. Update Invoices Table to link to Agreement
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'agreement_id') THEN
        ALTER TABLE public.invoices ADD COLUMN agreement_id UUID REFERENCES public.agreements(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'agreement_phase_id') THEN
        ALTER TABLE public.invoices ADD COLUMN agreement_phase_id UUID REFERENCES public.agreement_phases(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'is_one_off') THEN
        ALTER TABLE public.invoices ADD COLUMN is_one_off BOOLEAN DEFAULT false;
    END IF;
END $$;
