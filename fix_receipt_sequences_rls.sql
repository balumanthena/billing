-- Fix RLS violations on receipt_sequences

-- 1. Ensure RLS is enabled (already done, but safe to repeat)
ALTER TABLE receipt_sequences ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts if any partial ones exist
DROP POLICY IF EXISTS "Users can view their company sequences" ON receipt_sequences;
DROP POLICY IF EXISTS "Users can insert their company sequences" ON receipt_sequences;
DROP POLICY IF EXISTS "Users can update their company sequences" ON receipt_sequences;

-- 3. Create Policies

-- SELECT: Allow users to view sequences for their company
CREATE POLICY "Users can view their company sequences"
ON receipt_sequences
FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid()
    )
    -- OR company_id = auth.uid() -- If we ever map company_id directly to auth.uid (unlikely here)
);

-- INSERT: Allow users to insert sequences for their company
CREATE POLICY "Users can insert their company sequences"
ON receipt_sequences
FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- UPDATE: Allow users to update sequences for their company
CREATE POLICY "Users can update their company sequences"
ON receipt_sequences
FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid()
    )
);

-- Note: DELETE is usually not needed for generic users, but if admin needs cleanup:
-- CREATE POLICY "Admins can delete sequences" ...
