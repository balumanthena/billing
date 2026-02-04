-- Enable RLS on invoice_sequences if not already enabled
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON invoice_sequences;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON invoice_sequences;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON invoice_sequences;

-- Policy to allow authenticated users to SELECT sequences (needed for reading current sequence)
CREATE POLICY "Enable select for authenticated users"
ON invoice_sequences FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to INSERT new sequences (needed for first-time setup per company)
CREATE POLICY "Enable insert for authenticated users"
ON invoice_sequences FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to allow authenticated users to UPDATE sequences (needed for incrementing invoice numbers)
CREATE POLICY "Enable update for authenticated users"
ON invoice_sequences FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
