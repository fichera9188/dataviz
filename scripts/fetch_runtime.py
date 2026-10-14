"""Vendor pinned Vega runtime and font assets so the story has no CDN dependency."""
import hashlib
import json
import re
import io
import tarfile
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[1] / 'site'
VENDOR = ROOT / 'assets/vendor'
FONTS = ROOT / 'assets/fonts'
VENDOR.mkdir(parents=True,exist_ok=True)
FONTS.mkdir(parents=True,exist_ok=True)
assets = [
    ('vega.min.js','https://cdn.jsdelivr.net/npm/vega@6.4.0/build/vega.min.js'),
    ('vega-lite.min.js','https://cdn.jsdelivr.net/npm/vega-lite@6.5.0/build/vega-lite.min.js'),
    ('vega-embed.min.js','https://cdn.jsdelivr.net/npm/vega-embed@7.3.0/build/vega-embed.min.js'),
    ('vega-LICENSE.txt','https://cdn.jsdelivr.net/npm/vega@6.4.0/LICENSE'),
    ('vega-lite-LICENSE.txt','https://cdn.jsdelivr.net/npm/vega-lite@6.5.0/LICENSE'),
    ('vega-embed-LICENSE.txt','https://cdn.jsdelivr.net/npm/vega-embed@7.3.0/LICENSE'),
]
def fetch(item):
    name,url=item
    data=urllib.request.urlopen(url,timeout=45).read()
    (VENDOR/name).write_bytes(data)
    return {'file':name,'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
with ThreadPoolExecutor(max_workers=6) as executor:
    records=list(executor.map(fetch,assets))

# Use only the Latin subset of the variable font; the system fonts are fallbacks.
css=''
for family,name in [('Fraunces','fraunces'),('DM Sans','dm-sans')]:
    package='@fontsource-variable/'+name
    metadata=json.load(urllib.request.urlopen('https://registry.npmjs.org/'+package+'/latest',timeout=40))
    fonturl=metadata['dist']['tarball']
    archive=tarfile.open(fileobj=io.BytesIO(urllib.request.urlopen(fonturl,timeout=40).read()),mode='r:gz')
    options=[n for n in archive.getnames() if '/files/' in n and '-latin-' in n and 'normal' in n and n.endswith('.woff2')]
    options.sort(key=lambda n: (0 if '-full-' in n else 1,len(n)))
    chosen=options[0]
    data=archive.extractfile(chosen).read()
    path=name+'.woff2'
    (FONTS/path).write_bytes(data)
    css += f"@font-face{{font-family:'{family}';font-style:normal;font-weight:100 900;font-display:swap;src:url('./{path}') format('woff2');}}\n"
    records.append({'file':'../fonts/'+path,'url':fonturl,'archive_entry':chosen,'package_version':metadata['version'],'bytes':len(data)})
    licenses=[n for n in archive.getnames() if n.endswith('/LICENSE') or n.endswith('/LICENSE.txt')]
    if licenses:
        (FONTS/(name+'-LICENSE.txt')).write_bytes(archive.extractfile(licenses[0]).read())
(FONTS/'fonts.css').write_text(css,encoding='utf-8')
(VENDOR/'asset-manifest.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
print(json.dumps(records,indent=2))
