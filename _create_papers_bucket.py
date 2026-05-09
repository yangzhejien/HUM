import subprocess, json, sys

url = "https://gslggufgrtmdeyyyveay.supabase.co/storage/v1/bucket"
# 使用新的 Service Role Key
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.yeqCTdqy8y-P5sobA_KJi6iIf2e3YyPaDOJDRJSoyVg"

# Create bucket payload
payload = {
    "id": "papers",
    "name": "papers",
    "public": True
}

print("Creating 'papers' bucket with Service Role Key...")
print()

r = subprocess.run(['curl.exe', '-sL', '--max-time', '30', '-X', 'POST', url, 
    '-H', f'apikey: {key}',
    '-H', f'Authorization: Bearer {key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps(payload)], 
    capture_output=True, timeout=35)

c = r.stdout.decode('utf-8', errors='replace')
print('Response:', c)
print()

if r.returncode == 0:
    try:
        data = json.loads(c)
        if 'error' in data or 'statusCode' in data:
            print(f"Error: {data.get('message', data.get('error', 'Unknown error'))}")
            if 'already exists' in str(c).lower() or 'duplicate' in str(c).lower():
                print("Bucket may already exist.")
        else:
            print("✓ Bucket created successfully!")
            print("Details:", json.dumps(data, indent=2))
    except json.JSONDecodeError:
        print('Raw response:', c)
else:
    print('Command failed:', r.stderr.decode('utf-8', errors='replace'))

# Also verify by listing buckets
print("\n" + "="*60)
print("Verifying bucket exists...")
print("="*60)

r2 = subprocess.run(['curl.exe', '-sL', '--max-time', '30', '-X', 'GET', 
    'https://gslggufgrtmdeyyyveay.supabase.co/storage/v1/bucket',
    '-H', f'apikey: {key}',
    '-H', f'Authorization: Bearer {key}'],
    capture_output=True, timeout=35)

c2 = r2.stdout.decode('utf-8', errors='replace')
try:
    buckets = json.loads(c2)
    print(f"Total buckets: {len(buckets)}")
    for b in buckets:
        public = b.get('public', 'unknown')
        print(f"  - {b['name']} (public={public})")
except:
    print('Error listing buckets:', c2)
