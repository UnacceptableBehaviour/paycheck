#! /usr/bin/env python

# cd into paycheck/docs
# run build_cache_file_list.py
# it will generate the FILES_TO_CACHE array / list
# copy paste it into SW

# if the local server is runing it will check if all files are present
# cd paycheck/
# run http-server -c-1
# re-run build_cache_file_list.py

from pathlib import Path
from pprint import pprint
import requests
import sys

user_name = 'unacceptablebehaviour'
repo_name = 'paycheck' # >--------------------------------------\
project_root = Path('/Users/simon/a_syllabus/lang/html_css_js/paycheck/docs')

dev_root = f"http://127.0.0.1:8080/{repo_name}/"
web_root = f"https://{user_name}.github.io/{repo_name}/"
url_root = dev_root

do_not_add_to_cache = ['service_worker.js','build_cache_file_list.py']

# const FILES_TO_CACHE = [
#   '/static/offline.html',
# ];
    
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


def url_exists(url):
    response = requests.get(url)
    if url_root == web_root: print(f"{response.status_code}\t{url}")
    return response.status_code == requests.codes.ok

if '-w' in sys.argv:
    url_root = web_root

try:
    print(f"Connecting to: {url_root} <")
    url_exists(url_root)
except requests.exceptions.ConnectionError:
    print(f"USE option -w to connect to web URL:{web_root}")
    sys.exit(f"Refused to connect to: {url_root} < Is server up?")
except BaseException as err:
    print(f"Unexpected {err=}\n{type(err)=}")
    #raise
    sys.exit(f"Failed trying to connect: {url_root}")
    
urls_to_check = [url_root]
for f in found:
    filepath = f.split(f"{repo_name}/docs/")[1]
    urls_to_check.append(f"{url_root}{filepath}")

fails = []
for u in urls_to_check:
    if not url_exists(u):
        fails.append(u)
        
if len(fails) > 0:
    print('* * * WARNING * * *   FAILED to retrieve following URL(s)')
    pprint(fails)
else:
    print('SUCCESS: all files present!')

if '-h' in sys.argv or '-help' in sys.argv or '--help' in sys.argv:
    print('-w (web) to check online existence of files')
