-- Create a new storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company_assets', 'company_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files to 'company_assets'
-- We restrict this to their own company folder ideally, but for MVP simple authenticated upload is fine.
-- A better approach is usually folder structure: company_id/logo.png

CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company_assets');

CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company_assets');

CREATE POLICY "Public can view company assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company_assets');

-- Policy to allow deleting? Maybe restricted to owner.
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company_assets' AND auth.uid() = owner);
