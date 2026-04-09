#!/bin/bash
# Remove MiniMax branding from all HTML files
cd /workspace/hum-journal
for file in *.html; do
    if [ -f "$file" ]; then
        # Find last </script> tag and truncate there
        last_script=$(grep -n "</script>" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$last_script" ]; then
            head -n "$last_script" "$file" > "${file}.tmp"
            echo -e "\n</body>\n</html>" >> "${file}.tmp"
            mv "${file}.tmp" "$file"
            echo "Cleaned: $file"
        fi
    fi
done
echo "✅ All files cleaned"
