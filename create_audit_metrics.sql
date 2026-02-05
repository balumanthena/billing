-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'finalize'
    old_data JSONB,
    new_data JSONB,
    performed_by UUID NULL, -- Auth User ID
    ip_address TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role = 'admin' OR role = 'accountant'
        )
    );

CREATE POLICY "System and users can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true); -- Allow insertion by authenticated users (during actions)

-- Add contract_type to master_invoices
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'master_invoices' AND column_name = 'contract_type') THEN
        ALTER TABLE public.master_invoices 
        ADD COLUMN contract_type TEXT DEFAULT 'project' CHECK (contract_type IN ('project', 'retainer', 'amc', 'milestone'));
    END IF;
END $$;
