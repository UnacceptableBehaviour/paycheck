#! /usr/bin/env python
from pathlib import Path
from pprint import pprint

repo_name = 'paycheck'
project_root = Path('/Users/simon/a_syllabus/lang/html_css_js/paycheck/docs')
do_not_add_to_cache = ['service_worker.js','build_cache_file_list.py','screenshot.jpg']

# const FILES_TO_CACHE = [
#   '/static/offline.html',
# ];
    
#prepend = ''
prepend = f"/{repo_name}"

print(f"const FILES_TO_CACHE = [\n  '/',\n  '/{repo_name}/',")

found = []
for p in project_root.glob('**/*'):
    path = str(p)
    if 'node_modules' in path or 'scratch' in path or p.is_dir() or '.DS_Store' in path: continue
    if p.name in do_not_add_to_cache: continue
    print(f"  '{prepend}{path.replace(str(project_root),'')}',")
    found.append(str(p))

print('];')

uniq = set(found)
if len(uniq) != len(found):
    print('* * * WARNING DUPLICATES IN LIST * * *')
    dupes = []; seen = set()
    for f in found:
        if f in seen:
            dupes.append(f)
        else:
            seen.add(f)
    pprint(dupes)
