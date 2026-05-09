import os, re

os.chdir(r'C:\Users\11409\Desktop\HUM-github')

with open('js/upload-handler.js', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r"SUPABASE_ANON_KEY = '([^']+)'", c)
key1 = m.group(1) if m else None

with open('academic.html', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r"SUPABASE_KEY: '([^']+)'", c)
key2 = m.group(1) if m else None

print('upload-handler length:', len(key1))
print('academic.html length:', len(key2))

# Find first difference
for i, (a, b) in enumerate(zip(key1, key2)):
    if a != b:
        print(f'First diff at pos {i}: {a!r} vs {b!r}')
        print(f'Context: ...{key1[max(0,i-10):i+10]}...')
        break
else:
    if len(key1) != len(key2):
        print(f'Length differs: {len(key1)} vs {len(key2)}')
    else:
        print('Keys are identical')
