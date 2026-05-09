import subprocess, json, sys

url = "https://gslggufgrtmdeyyyveay.supabase.co/storage/v1/bucket"
# Service role key
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE4NDQ3MiwiZXhwIjoyMDkyNzYwNDcyfQ.yeqCTdqy8y-P5sobA_KJi6iIf2e3YyPaDOJDRJSoyVg"

# Create bucket payload
payload = {
    "id": "papers",
    "name": "papers",
    "public": True
}

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
        if 'error' in data:
            print('Error:', data['error'])
            print('Message:', data.get('message', 'N/A'))
        else:
            print('Success! Bucket created:')
            print(json.dumps(data, indent=2))
    except:
        print('Raw response:', c)
else:
    print('Command failed:', r.stderr.decode('utf-8', errors='replace'))
