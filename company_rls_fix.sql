-- Allow authenticated users to create a company
-- (Needed for initial setup)
CREATE POLICY "Users can insert company" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own company
CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (id = get_auth_company_id());

-- Grant usage on sequence just in case (though UUIDs are used)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
