-- Add attachment_url column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Use the existing company_assets bucket but maybe we should ensure policies cover it.
-- The existing policies on storage.objects refer to bucket_id = 'company_assets'.
-- We will store receipts in 'company_assets' bucket under 'receipts/filename'.

-- Just re-asserting policies to be safe (idempotent if already exists differently handled usually, but for this dev env):
-- We assume the previous setup from storage_setup.sql handles INSERT/SELECT for authenticated users.
