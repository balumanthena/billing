-- CONSOLIDATED PERMISSION FIX
-- Run this entire script to fix the "New row violates row-level security policy" error.

-- 1. FIX COMPANIES TABLE PERMISSIONS
DROP POLICY IF EXISTS "Users can insert company" ON companies;
CREATE POLICY "Users can insert company" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = get_auth_company_id());

DROP POLICY IF EXISTS "Users can update own company" ON companies;
CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (id = get_auth_company_id());

-- 2. FIX PROFILES TABLE PERMISSIONS
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 3. ENSURE PUBLIC SCHEMA ACCESS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
