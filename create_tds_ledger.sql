-- Create TDS Ledger Table
create table if not exists tds_ledger (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references companies(id) not null,
    invoice_id uuid references invoices(id) not null,
    customer_id uuid references parties(id) not null,
    financial_year text not null, -- e.g. '2025-26'
    taxable_value numeric not null,
    tds_rate numeric not null,
    tds_amount numeric not null,
    section_code text default '194J', -- 194J for Tech Services, 194C for Contractors
    deducted_on date, -- Defaults to Invoice Date usually, or Payment Date? Usually Invoice Date for liability.
    status text check (status in ('pending', 'credited', 'claimed')) default 'pending',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for faster reporting
create index if not exists idx_tds_ledger_company on tds_ledger(company_id);
create index if not exists idx_tds_ledger_invoice on tds_ledger(invoice_id);
create index if not exists idx_tds_ledger_fy on tds_ledger(financial_year);

-- RLS Policies
alter table tds_ledger enable row level security;

create policy "Users can view their company TDS ledger"
    on tds_ledger for select
    using (company_id in (select company_id from profiles where id = auth.uid()));

create policy "Users can insert TDS ledger entries"
    on tds_ledger for insert
    with check (company_id in (select company_id from profiles where id = auth.uid()));

create policy "Users can update TDS ledger entries"
    on tds_ledger for update
    using (company_id in (select company_id from profiles where id = auth.uid()));
