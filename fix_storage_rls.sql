-- =====================================================
-- HUM Journal - Fix Storage RLS Policies
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies for papers bucket (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous uploads to papers" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from papers" ON storage.objects;

-- 3. Create policy to allow anonymous users to UPLOAD files to papers bucket
CREATE POLICY "Allow anonymous uploads to papers"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'papers');

-- 4. Create policy to allow anonymous users to READ/DOWNLOAD files from papers bucket
CREATE POLICY "Allow anonymous reads from papers"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'papers');

-- 5. Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
