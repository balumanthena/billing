-- MANUAL REPAIR SCRIPT
-- This will manually create a company and force-link it to your specific user ID.

BEGIN;

-- 1. Create the company and capture the ID
WITH new_company AS (
  INSERT INTO companies (name, gstin, address, state, state_code)
  VALUES ('Manual Fix Company', '29ABCDE1234F1Z5', '123 Tech Park', 'Telangana', '36')
  RETURNING id
)
-- 2. Update your specific profile with this new company ID
UPDATE profiles
SET company_id = (SELECT id FROM new_company),
    role = 'admin'
WHERE id = 'defb0037-6943-4332-867a-b7ebfcd39df9'; -- Your User ID from screenshot

COMMIT;
