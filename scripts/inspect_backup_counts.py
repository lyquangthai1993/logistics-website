import re

with open('d:/Projects/logistics-website/backups/neondb_backup_20261012.sql', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'COPY public\.("[^"]+"|[a-zA-Z0-9_]+) [^\n]+\n(.*?)\\\.'
matches = re.findall(pattern, content, re.DOTALL)

print(f"{'Table':<30} | {'Rows in Dump':<15}")
print("-" * 48)
for tbl, data in matches:
    lines = [l for l in data.strip().split('\n') if l.strip()]
    print(f"{tbl:<30} | {len(lines):<15}")
