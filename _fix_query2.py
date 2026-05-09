import os

os.chdir(r'C:\Users\11409\Desktop\HUM-github')

for f in ['academic.html', 'public.html']:
    with open(f, 'r', encoding='utf-8') as fp:
        c = fp.read()
    
    # Remove the .eq('status', 'published') filter
    old = ".eq('status', 'published')"
    new = ""
    c = c.replace(old, new)
    
    with open(f, 'w', encoding='utf-8') as fp:
        fp.write(c)
    print(f'Updated {f}')

print('Done')
