import subprocess, json, sys

url = "https://gslggufgrtmdeyyyveay.supabase.co/storage/v1/bucket"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

r = subprocess.run(['curl.exe', '-sL', '--max-time', '30', url, 
    '-H', f'apikey: {key}',
    '-H', f'Authorization: Bearer {key}'],
    capture_output=True, timeout=35)

c = r.stdout.decode('utf-8', errors='replace')
print('Raw response:', c)
print()
print('Buckets:')
try:
    data = json.loads(c)
    if isinstance(data, list):
        for b in data:
            print(f"  - {b.get('name')} (public: {b.get('public', False)})")
    else:
        print('Unexpected format:', data)
except Exception as e:
    print('Parse error:', e)
    print('Response was:', c[:200])
