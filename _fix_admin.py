import os, re

os.chdir(r'C:\Users\11409\Desktop\HUM-github')

# Get correct key
with open('js/upload-handler.js', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r"SUPABASE_ANON_KEY = '([^']+)'", c)
correct_key = m.group(1)

for fname in ['admin.html', 'submission.html', 'login.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    # Look for SUPABASE_ANON_KEY
    m = re.search(r"SUPABASE_ANON_KEY\s*=\s*'([^']+)'", c)
    if m:
        key = m.group(1)
        if key != correct_key:
            print(f'{fname}: WRONG key (len={len(key)}), fixing...')
            c = c.replace(key, correct_key)
            with open(fname, 'w', encoding='utf-8') as f:
                f.write(c)
        else:
            print(f'{fname}: OK')
    else:
        print(f'{fname}: no SUPABASE_ANON_KEY found')
