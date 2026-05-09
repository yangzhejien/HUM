import subprocess, json

anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

print("Testing anon access to papers bucket...")

r = subprocess.run([
    'curl.exe', '-sL', '--max-time', '30',
    '-X', 'POST',
    'https://gslggufgrtmdeyyyveay.supabase.co/storage/v1/object/list/papers',
    '-H', f'apikey: {anon_key}',
    '-H', f'Authorization: Bearer {anon_key}',
    '-H', 'Content-Type: application/json',
    '-d', json.dumps({"prefix": ""})
], capture_output=True, timeout=35)

c = r.stdout.decode('utf-8', errors='replace')
print(f"Status: {r.returncode}")
print(f"Response: {c}")

try:
    data = json.loads(c)
    if isinstance(data, list):
        print(f"\n✓ SUCCESS! Anon can access papers bucket.")
        print(f"  Files: {len(data)}")
    else:
        print(f"\n✗ Error: {data.get('message', data)}")
except:
    print(f"\nRaw: {c}")
