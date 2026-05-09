import requests
import json

# Supabase configuration
SUPABASE_URL = "https://gslggufgrtmdeyyyveay.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.yeqCTdqy8y-P5sobA_KJi6iIf2e3YyPaDOJDRJSoyVg"

headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Content-Type": "application/json"
}

# Try to create RLS policies using Postgres API
# First, let's try to enable RLS and create policies

sql_commands = """
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous uploads to papers" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous reads from papers" ON storage.objects;

-- Create policy for anonymous uploads
CREATE POLICY "Allow anonymous uploads to papers"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'papers');

-- Create policy for anonymous reads
CREATE POLICY "Allow anonymous reads from papers"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'papers');
"""

# Try using the REST API to execute SQL
print("Attempting to create Storage RLS policies...")

# Method 1: Try using pg_rest API
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
    headers=headers,
    json={"sql": sql_commands}
)

print(f"RPC Status: {response.status_code}")
print(f"RPC Response: {response.text}")

if response.status_code == 200:
    print("[OK] RLS policies created successfully!")
else:
    print("[INFO] RPC method failed, trying alternative approach...")
    
    # Method 2: Try direct SQL via query parameter
    response2 = requests.post(
        f"{SUPABASE_URL}/rest/v1/sql",
        headers=headers,
        data=sql_commands
    )
    print(f"SQL Status: {response2.status_code}")
    print(f"SQL Response: {response2.text}")
