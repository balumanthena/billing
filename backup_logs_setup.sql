
-- Create backup_logs table to track email delivery status
create table if not exists backup_logs (
    id uuid default gen_random_uuid() primary key,
    entity_type text not null, -- 'Invoice', 'Receipt', 'Agreement', 'Party'
    entity_id text not null,
    status text not null default 'pending', -- 'pending', 'processing', 'sent', 'failed'
    attempt_count int default 0,
    last_attempt_at timestamptz,
    error_message text,
    created_at timestamptz default now()
);

-- Index for fast lookup of pending/failed jobs
create index if not exists idx_backup_logs_status on backup_logs(status);
create index if not exists idx_backup_logs_entity on backup_logs(entity_type, entity_id);

-- RLS Policy (Admin / Company only)
alter table backup_logs enable row level security;

create policy "Enable read for authenticated users only"
on backup_logs for select
to authenticated
using (true);

create policy "Enable insert for authenticated users only"
on backup_logs for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users only"
on backup_logs for update
to authenticated
using (true);
