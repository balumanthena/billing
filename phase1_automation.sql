-- PHASE 1: AUTOMATION SCHEMA

-- 1. Recurring Invoice Rules
-- Defines "Templates" that auto-generate invoices
CREATE TABLE IF NOT EXISTS public.recurring_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    customer_id UUID REFERENCES public.parties(id) NOT NULL,
    agreement_id UUID REFERENCES public.agreements(id), -- Optional link to contract
    
    -- Schedule
    cron_expression TEXT NOT NULL, -- e.g. "0 9 1 * *" (1st of month at 9am)
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    
    -- Template Data (What the invoice looks like)
    amount NUMERIC NOT NULL DEFAULT 0,
    items_snapshot JSONB NOT NULL, -- Array of items to add
    tax_mode TEXT DEFAULT 'exclusive',
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Recurring Rules
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage recurring rules" ON public.recurring_rules
    USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));


-- 2. Communication Logs (Audit Trail for Reminders)
CREATE TABLE IF NOT EXISTS public.communication_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) NOT NULL,
    
    -- Target
    invoice_id UUID REFERENCES public.invoices(id),
    recipient_email TEXT NOT NULL,
    
    -- Details
    type TEXT NOT NULL, -- 'reminder_due_soon', 'reminder_overdue', 'invoice_sent'
    status TEXT DEFAULT 'sent', -- 'sent', 'failed'
    metadata JSONB, -- Store error message or SMTP id
    
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Logs
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs" ON public.communication_logs
    FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- System can insert logs (via Service Role) or Users? 
-- Usually system inserts via Cron. Cron bypasses RLS if using Service Key.
-- If user manually sends reminder, they need INSERT.
CREATE POLICY "Users can insert logs" ON public.communication_logs
    FOR INSERT WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Index for Cron performance
CREATE INDEX idx_recurring_next_run ON public.recurring_rules (next_run_at) WHERE status = 'active';
