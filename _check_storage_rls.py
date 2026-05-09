import requests
import json

# Supabase configuration
SUPABASE_URL = "https://gslggufgrtmdeyyyveay.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.yeqCTdqy8y-P5sobA_KJi6iIf2e3YyPaDOJDRJSoyVg"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

headers = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Content-Type": "application/json"
}

# Test uploading to Storage with anon key
print("Testing Storage upload with anon key...")

# Create a simple test file
test_content = b"Test PDF content"

# Try to upload using anon key
upload_headers = {
    "Authorization": f"Bearer {ANON_KEY}",
    "apikey": ANON_KEY,
    "Content-Type": "application/pdf",
    "x-upsert": "false"
}

file_name = f"test_{int(__import__('time').time())}.pdf"

response = requests.post(
    f"{SUPABASE_URL}/storage/v1/object/papers/{file_name}",
    headers=upload_headers,
    data=test_content
)

print(f"Upload Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("[OK] Storage upload successful! RLS allows anonymous uploads.")
    # Clean up
    del_response = requests.delete(
        f"{SUPABASE_URL}/storage/v1/object/papers/{file_name}",
        headers=headers
    )
    print(f"Cleaned up: {del_response.status_code}")
elif response.status_code == 403:
    print("[ERROR] Storage RLS is blocking anonymous uploads!")
    print("\nTo fix this, run this SQL in Supabase Dashboard SQL Editor:")
    print("""
-- Allow anonymous users to upload to papers bucket
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'papers');

-- Allow anonymous users to read from papers bucket
CREATE POLICY "Allow anonymous reads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'papers');
    """)
else:
    print(f"[INFO] Unexpected status: {response.status_code}")
