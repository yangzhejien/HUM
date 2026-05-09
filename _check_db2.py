import subprocess, json, sys

url = "https://gslggufgrtmdeyyyveay.supabase.co/rest/v1/articles?select=*"
# Correct key from upload-handler.js
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODQ0NzIsImV4cCI6MjA5Mjc2MDQ3Mn0.N4bpqRGmez2hxfyRDoW6YAaWeQGGJkhMd1v3N7NTKWs"

r = subprocess.run(['curl.exe', '-sL', '--max-time', '15', url, 
    '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'], 
    capture_output=True, timeout=20)

c = r.stdout.decode('utf-8', errors='replace')
print('Response:', c[:800])
print()
try:
    data = json.loads(c)
    if isinstance(data, list):
        print(f'Articles count: {len(data)}')
        for a in data:
            print(f"  - {a.get('title','N/A')} ({a.get('status','N/A')}, {a.get('category','N/A')})")
    else:
        print('Error response:', data)
except Exception as e:
    print('Parse error:', e)
    print('Raw:', c)
