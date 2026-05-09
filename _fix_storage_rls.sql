-- Fix Storage RLS policies for papers bucket
-- Run this in Supabase Dashboard > SQL Editor

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for papers bucket if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads to papers" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from papers" ON storage.objects;

-- Allow anonymous users to upload files to papers bucket
CREATE POLICY "Allow anonymous uploads to papers"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'papers');

-- Allow anonymous users to read/download files from papers bucket
CREATE POLICY "Allow anonymous reads from papers"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'papers');

-- Verify policies
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
