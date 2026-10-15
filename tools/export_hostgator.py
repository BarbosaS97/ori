"""
Monta a pasta (e o .zip) com SÓ o que vai ao ar no HostGator.
Varre as páginas HTML a partir da Home, coleta todo arquivo local referenciado (href/src/srcset e url() do CSS)
e copia para  ../site-hostgator/ ; depois gera ../site-hostgator.zip.
Fica de fora: tools/, README, publicar.bat, .git, .claude, .nojekyll e qualquer arquivo não usado.

Rodar (depois de  python tools/build_site.py):   python tools/export_hostgator.py
"""
import os, re, shutil, sys, zipfile
from urllib.parse import urlsplit, unquote

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(os.path.dirname(HERE), "site-hostgator")
ZIP = OUT + ".zip"

ROOT_EXTRAS = [".htaccess", "robots.txt", "sitemap.xml", "404.html", "favicon.ico", "favicon-32.png", "apple-touch-icon.png"]

def local(ref, base_dir):
    ref = ref.strip()
    if not ref or re.match(r"(https?:|//|data:|mailto:|tel:|#|javascript:)", ref): return None
    path = unquote(urlsplit(ref).path)
    if not path: return None
    full = os.path.normpath(os.path.join(HERE if path.startswith("/") else base_dir, path.lstrip("/")))
    if full.endswith(os.sep) or os.path.isdir(full): full = os.path.join(full, "index.html")
    return full if os.path.isfile(full) and full.startswith(HERE) else None

def refs_html(txt):
    out = re.findall(r'(?:href|src|data-src|data-full)="([^"]+)"', txt)
    for s in re.findall(r'(?:srcset|data-srcset)="([^"]+)"', txt):
        out += [p.strip().split()[0] for p in s.split(",") if p.strip()]
    out += re.findall(r"url\(['\"]?([^'\")]+)", txt)
    return out

def refs_css(txt):
    return re.findall(r"url\(['\"]?([^'\")]+)", txt)

seen, queue = set(), [os.path.join(HERE, "index.html")]
for extra in ROOT_EXTRAS:
    f = os.path.join(HERE, extra)
    if os.path.isfile(f): queue.append(f)
# todas as páginas HTML do site (projetos, história, links, atalhos)
for dp, dn, fn in os.walk(HERE):
    rel = os.path.relpath(dp, HERE)
    if rel.split(os.sep)[0] in ("tools", ".git", ".claude", "assets", "vendor", "node_modules"): continue
    for f in fn:
        if f.endswith(".html"): queue.append(os.path.join(dp, f))

while queue:
    f = queue.pop()
    if f in seen: continue
    seen.add(f)
    ext = os.path.splitext(f)[1].lower()
    if ext not in (".html", ".css"): continue
    txt = open(f, encoding="utf-8", errors="ignore").read()
    for r in (refs_html(txt) if ext == ".html" else refs_css(txt)):
        l = local(r, os.path.dirname(f))
        if l and l not in seen: queue.append(l)

files = sorted(os.path.relpath(f, HERE) for f in seen)
if os.path.isdir(OUT): shutil.rmtree(OUT)
for rel in files:
    dst = os.path.join(OUT, rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(os.path.join(HERE, rel), dst)
with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as z:
    for rel in files: z.write(os.path.join(OUT, rel), rel.replace(os.sep, "/"))
size = sum(os.path.getsize(os.path.join(OUT, r)) for r in files)
print(f"{len(files)} arquivos, {size/1048576:.1f} MB  ->  {OUT}\n   zip: {ZIP}")
