"""
Otimiza SOMENTE as fotos escolhidas em projects_data.py.
Gera, para cada foto:  NN.webp (lado maior 1800 px)  e  NN-s.webp (lado maior 900 px)
em assets/projetos/<slug>/, mais tools/manifest.json com as dimensões (evita "pulo" de layout).

Rodar (na pasta do projeto):  python tools/build_images.py
Só funciona na máquina que tem as fotos originais (SOURCE_ROOT).
"""
import json, os, re, sys
from PIL import Image, ImageOps

sys.path.insert(0, os.path.dirname(__file__))
from projects_data import PROJECTS, SOURCE_ROOT

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, "assets", "projetos")
nat = lambda s: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]

def listing(folder):
    fs = sorted([f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".jpeg", ".png"))], key=nat)
    return [os.path.join(folder, f) for f in fs]

def save(im, path, longest, q):
    im = im.copy(); im.thumbnail((longest, longest), Image.LANCZOS)
    im.save(path, "WEBP", quality=q, method=6)
    return im.size

manifest, total = {}, 0
for p in PROJECTS:
    files = listing(os.path.join(SOURCE_ROOT, p["src"]))
    d = os.path.join(OUT, p["slug"]); os.makedirs(d, exist_ok=True)
    items = []
    for n, idx in enumerate(p["picks"], 1):
        im = ImageOps.exif_transpose(Image.open(files[idx])).convert("RGB")
        big = save(im, os.path.join(d, f"{n:02d}.webp"), 1800, 78)
        small = save(im, os.path.join(d, f"{n:02d}-s.webp"), 900, 74)
        items.append({"n": n, "w": big[0], "h": big[1], "sw": small[0], "sh": small[1]})
        total += os.path.getsize(os.path.join(d, f"{n:02d}.webp")) + os.path.getsize(os.path.join(d, f"{n:02d}-s.webp"))
    manifest[p["slug"]] = items
    print(f'{p["slug"]:18} {len(items)} fotos')

json.dump(manifest, open(os.path.join(HERE, "tools", "manifest.json"), "w"), indent=1)
print(f"total: {total/1e6:.1f} MB")
