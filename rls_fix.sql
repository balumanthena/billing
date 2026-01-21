-- Allow users to view their own profile explicitly
-- This prevents issues where the company-based policy might fail or be circular during onboarding
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Also ensure they can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
