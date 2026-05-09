import os, re

os.chdir(r'C:\Users\11409\Desktop\HUM-github')

# Extract key from upload-handler.js
with open('js/upload-handler.js', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']+)'", c)
if m:
    key1 = m.group(1)
    print('upload-handler.js:', key1[:50])

# Extract key from academic.html
with open('academic.html', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r"SUPABASE_KEY:\s*'([^']+)'", c)
if m:
    key2 = m.group(1)
    print('academic.html:', key2[:50])

print('Same:', key1 == key2)
