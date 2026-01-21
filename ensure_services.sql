-- 1. Add Filter Column
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Insert Services for Citrux
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- Find Company 'Citrux' (Case insensitive)
    SELECT id INTO v_company_id FROM companies WHERE name ILIKE '%Citrux%' LIMIT 1;

    IF v_company_id IS NULL THEN
        RAISE NOTICE 'Company Citrux not found, skipping service insertion.';
        RETURN;
    END IF;

    -- Insert Services (Idempotent)
    
    -- 1. Website Design & Development
    IF NOT EXISTS (SELECT 1 FROM items WHERE company_id = v_company_id AND name = 'Website Design & Development') THEN
        INSERT INTO items (company_id, name, description, sac_code, tax_rate, unit_price, is_active)
        VALUES (v_company_id, 'Website Design & Development', 'Custom website design and development services', '998314', 18, 0, TRUE);
    END IF;

    -- 2. E-Commerce Store Development
    IF NOT EXISTS (SELECT 1 FROM items WHERE company_id = v_company_id AND name = 'E-Commerce Store Development') THEN
        INSERT INTO items (company_id, name, description, sac_code, tax_rate, unit_price, is_active)
        VALUES (v_company_id, 'E-Commerce Store Development', 'Online store setup and development', '998314', 18, 0, TRUE);
    END IF;

    -- 3. UI/UX Design Services
    IF NOT EXISTS (SELECT 1 FROM items WHERE company_id = v_company_id AND name = 'UI/UX Design Services') THEN
        INSERT INTO items (company_id, name, description, sac_code, tax_rate, unit_price, is_active)
        VALUES (v_company_id, 'UI/UX Design Services', 'User interface and user experience design', '998314', 18, 0, TRUE);
    END IF;

    -- 4. Mobile & App Development
    IF NOT EXISTS (SELECT 1 FROM items WHERE company_id = v_company_id AND name = 'Mobile & App Development') THEN
        INSERT INTO items (company_id, name, description, sac_code, tax_rate, unit_price, is_active)
        VALUES (v_company_id, 'Mobile & App Development', 'iOS and Android application development', '998314', 18, 0, TRUE);
    END IF;

    -- 5. Healthcare RCM & Medical Coding Services
    IF NOT EXISTS (SELECT 1 FROM items WHERE company_id = v_company_id AND name = 'Healthcare RCM & Medical Coding Services') THEN
        INSERT INTO items (company_id, name, description, sac_code, tax_rate, unit_price, is_active)
        VALUES (v_company_id, 'Healthcare RCM & Medical Coding Services', 'Revenue Cycle Management and Medical Coding', '998314', 18, 0, TRUE);
    END IF;

    -- 6. Support & Maintenance Services
    IF NOT EXISTS (SELECT 1 FROM items WHERE company_id = v_company_id AND name = 'Support & Maintenance Services') THEN
        INSERT INTO items (company_id, name, description, sac_code, tax_rate, unit_price, is_active)
        VALUES (v_company_id, 'Support & Maintenance Services', 'Ongoing technical support and maintenance', '998314', 18, 0, TRUE);
    END IF;

END $$;
