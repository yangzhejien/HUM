import subprocess, json, sys

url = "https://gslggufgrtmdeyyyveay.supabase.co/rest/v1/articles?select=*"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbGdndWZncnRtZGV5eXl2ZWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODk0MjYsImV4cCI6MjA2MTI2NTQyNn0.9aToFofHZaM9crNMcCpaAQ_xGpm2MBJ"

r = subprocess.run(['curl.exe', '-sL', '--max-time', '15', url, 
    '-H', f'apikey: {key}', '-H', f'Authorization: Bearer {key}'], 
    capture_output=True, timeout=20)

c = r.stdout.decode('utf-8', errors='replace')
print('Response:', c[:500])
try:
    data = json.loads(c)
    print(f'Articles count: {len(data)}')
    for a in data[:5]:
        print(f"  - {a.get('title','N/A')} ({a.get('status','N/A')}, {a.get('category','N/A')})")
except Exception as e:
    print('Parse error:', e)
