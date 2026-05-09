-- Fix RLS policies for articles table
-- This script enables anonymous users to insert and read articles

-- Enable RLS on articles table (if not already enabled)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous read" ON public.articles;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.articles;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.articles;

-- Create policy to allow anonymous users to read all articles
CREATE POLICY "Allow anonymous read" 
ON public.articles 
FOR SELECT 
TO anon 
USING (true);

-- Create policy to allow anonymous users to insert new articles
CREATE POLICY "Allow anonymous insert" 
ON public.articles 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create policy to allow anonymous users to update articles (for admin functions)
CREATE POLICY "Allow anonymous update" 
ON public.articles 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'articles';
