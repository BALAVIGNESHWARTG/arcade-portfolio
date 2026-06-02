import os
import re

def fix_html_files(root_dir):
    fixed_count = 0
    for subdir, _, files in os.walk(root_dir):
        if "node_modules" in subdir or ".git" in subdir:
            continue
            
        for file in files:
            if file == "index.html":
                filepath = os.path.join(subdir, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                modified = False
                
                # 1. Fix missing viewport
                if "name=\"viewport\"" not in content and "<head>" in content:
                    viewport_tag = '\n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
                    content = content.replace("<head>", f"<head>{viewport_tag}")
                    modified = True
                
                # 2. Fix missing touch-action / user-select
                if "touch-action" not in content:
                    # Try to add it to the body CSS block
                    body_regex = re.compile(r'(body\s*{[^}]*)', re.IGNORECASE)
                    if body_regex.search(content):
                        content = body_regex.sub(r'\1 touch-action: none; user-select: none;', content)
                        modified = True
                    else:
                        # Try to find style tag and add a universal rule
                        style_regex = re.compile(r'(<style[^>]*>)', re.IGNORECASE)
                        if style_regex.search(content):
                            content = style_regex.sub(r'\1\n        * { touch-action: none; user-select: none; }', content)
                            modified = True
                
                if modified:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    fixed_count += 1
                    print(f"Patched: {filepath}")

    print(f"\nTotal files patched structurally: {fixed_count}")

if __name__ == "__main__":
    fix_html_files(r"E:\All Projects\10_Project_Ideas\arcade-games")
