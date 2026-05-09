import os, re, glob

os.chdir(r'C:\Users\11409\Desktop\HUM-github')

# Get correct key from upload-handler.js
with open('js/upload-handler.js', 'r', encoding='utf-8') as f:
    c = f.read()
m = re.search(r"SUPABASE_ANON_KEY = '([^']+)'", c)
correct_key = m.group(1)
print('Correct key from upload-handler.js, length:', len(correct_key))

# Update all HTML files
for f in glob.glob('*.html'):
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    # Find and replace the key
    old_match = re.search(r"SUPABASE_KEY: '([^']+)'", content)
    if old_match:
        old_key = old_match.group(1)
        if old_key != correct_key:
            content = content.replace(old_key, correct_key)
            with open(f, 'w', encoding='utf-8') as fp:
                fp.write(content)
            print(f'Fixed {f} (old key was wrong)')
        else:
            print(f'OK {f}')

print('Done')
