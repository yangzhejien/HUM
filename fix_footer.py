import os

# Files to process
files = ['about.html', 'admin.html', 'introduction.html', 'review.html', 'submission.html']

for filename in files:
    filepath = '/workspace/hum-journal/' + filename
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find and replace the old footer section
        # The footer starts with <!-- REMOVED --> and ends with </html>
        old_pattern = '<!-- REMOVED -->\n    <div class="tooltip-content">'

        if old_pattern in content:
            start_idx = content.find(old_pattern)

            # Replace with simple copyright before </body></html>
            new_content = content[:start_idx] + '''<div style="position: fixed; bottom: 10px; right: 20px; font-size: 12px; color: #999;">
  © 2026 Kirk
</div>

</body>
</html>'''

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            if '© 2026 Kirk' in content:
                print(f"{filename} already has simple copyright")
            else:
                print(f"Pattern not found in {filename}")
    except Exception as e:
        print(f"Error processing {filename}: {e}")

print("Done!")
