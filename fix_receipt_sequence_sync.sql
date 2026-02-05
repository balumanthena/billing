-- Resync receipt_sequences table with actual max receipt numbers in payments table
-- Run this if you get "duplicate key value violates unique constraint" errors

DO $$
DECLARE
    r RECORD;
    v_fy TEXT;
    v_max_seq INTEGER;
BEGIN
    -- Iterate through all companies that have receipts
    FOR r IN SELECT DISTINCT company_id FROM payments WHERE receipt_number LIKE 'RCPT-%' LOOP
        
        -- Find all FYs present in that company's receipts
        FOR v_fy IN 
            SELECT DISTINCT substring(receipt_number from 'RCPT-(\d{2}-\d{2})-\d{4}') 
            FROM payments 
            WHERE company_id = r.company_id AND receipt_number LIKE 'RCPT-%'
        LOOP
            IF v_fy IS NOT NULL THEN
                -- Find max sequence number for this Company + FY
                SELECT MAX(CAST(substring(receipt_number from 'RCPT-\d{2}-\d{2}-(\d{4})') AS INTEGER))
                INTO v_max_seq
                FROM payments
                WHERE company_id = r.company_id
                  AND receipt_number LIKE 'RCPT-' || v_fy || '-%';
                  
                -- Upsert/Update the sequence table
                INSERT INTO receipt_sequences (company_id, financial_year, last_sequence)
                VALUES (r.company_id, v_fy, v_max_seq)
                ON CONFLICT (company_id, financial_year)
                DO UPDATE SET last_sequence = GREATEST(receipt_sequences.last_sequence, EXCLUDED.last_sequence);
                
                RAISE NOTICE 'Synced Company % FY % to Sequence %', r.company_id, v_fy, v_max_seq;
            END IF;
        END LOOP;
    END LOOP;
END;
$$;
