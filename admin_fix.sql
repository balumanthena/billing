-- 1. Promote specific user to Admin
-- This will create a profile if it doesn't exist, or update the role if it does.
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin'::user_role, 'Admin User'
FROM auth.users
WHERE email = 'indcitrux@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin'::user_role;

-- 2. (Optional) Auto-create profiles for new users
-- Run this if you want every new signup to have a 'viewer' profile by default.
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'viewer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
*/
