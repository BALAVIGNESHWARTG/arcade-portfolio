import os
import re

directory = r"E:\All Projects\10_Project_Ideas\arcade-games"

fixed_count = 0

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue

            original = content
            
            # Remove canvas shadow operations
            content = re.sub(r'ctx\.shadowBlur\s*=\s*[^;]+;', '', content)
            content = re.sub(r'ctx\.shadowColor\s*=\s*[^;]+;', '', content)
            
            # Remove expensive CSS filters
            content = re.sub(r'mix-blend-mode:\s*[^;]+;', '', content)
            content = re.sub(r'backdrop-filter:\s*[^;]+;', '', content)
            
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed {file}")
                fixed_count += 1

print(f"Total files fixed: {fixed_count}")
