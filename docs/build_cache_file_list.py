#! /usr/bin/env python
from pathlib import Path
from pprint import pprint

repo_name = 'paycheck'
project_root = Path('/Users/simon/a_syllabus/lang/html_css_js/paycheck/docs')
do_not_add_to_cache = ['service_worker.js','build_cache_file_list.py']

# const FILES_TO_CACHE = [
#   '/static/offline.html',
# ];

if __name__ == '__main__':
    
    search_path = project_root
    prepend = ''
    prepend = f"/{repo_name}"
    
    print("const FILES_TO_CACHE = [\n  '/',")
    
    for p in project_root.glob('**/*'):
        path = str(p)
        if 'node_modules' in path or 'scratch' in path or p.is_dir() or '.DS_Store' in path: continue
        if p.name in do_not_add_to_cache: continue
        #print(p)
        #print(path.replace(str(project_root),''))
        print(f"  '{prepend}{path.replace(str(project_root),'')}',")
    
    print('];')
