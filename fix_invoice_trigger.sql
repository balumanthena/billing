-- FIX: Remove 'sent' from Trigger to prevent Enum Error
-- The trigger was checking against 'sent' which doesn't exist in the database enum, causing a crash.

CREATE OR REPLACE FUNCTION prevent_invoice_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Define "Locked" statuses
    -- REMOVED 'sent' from this list to fix the error
    IF OLD.status IN ('finalized', 'paid', 'partially_paid') THEN
        
        IF TG_OP = 'DELETE' THEN
            -- Allow if it's strictly a soft-delete (update is_deleted)
            -- But this is a DELETE trigger.
            RAISE EXCEPTION 'Cannot delete a finalized invoice. Cancel it instead.';
        END IF;

        IF TG_OP = 'UPDATE' THEN
             -- Check if restricted fields are changing
             IF OLD.grand_total IS DISTINCT FROM NEW.grand_total OR
                OLD.invoice_number IS DISTINCT FROM NEW.invoice_number OR
                OLD.date IS DISTINCT FROM NEW.date THEN
                    RAISE EXCEPTION 'Cannot edit core details of a finalized invoice.';
             END IF;
             
             -- Allow status updates (e.g. paid), IsDeleted (soft delete), etc.
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Force refresh of policy cache just in case
NOTIFY pgrst, 'reload config';
