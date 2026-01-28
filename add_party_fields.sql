-- Add missing fields to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS pan TEXT;

-- Verify email and phone exist (they are in the schema but just in case)
ALTER TABLE parties ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE parties ADD COLUMN IF NOT EXISTS phone TEXT;
