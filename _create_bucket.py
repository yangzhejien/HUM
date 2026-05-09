import subprocess, json, sys

url = "https://gslggufgrtmdeyyyveay.supabase.co/storage/v1/bucket"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

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
print('Status code check...')
if r.returncode == 0:
    try:
        data = json.loads(c)
        print('Parsed:', json.dumps(data, indent=2))
    except:
        print('Raw response:', c)
else:
    print('Error:', r.stderr.decode('utf-8', errors='replace'))
