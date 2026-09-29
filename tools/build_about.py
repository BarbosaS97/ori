"""
Gera as versões otimizadas da foto do "Sobre" (as duas arquitetas) em assets/:
  sobre-nos.webp    (1600 px de largura)  e  sobre-nos-s.webp (900 px)
A foto original fica fora do repositório (SOURCE = pasta do projeto).
Rodar:  python tools/build_about.py
"""
import os, glob
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(os.path.dirname(HERE), "IMG_5927.JPG.jpeg")     # foto de alta resolução enviada pela cliente
im = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGB")
print("original:", im.size)
for name, w, q in (("sobre-nos.webp", 1600, 80), ("sobre-nos-s.webp", 900, 78)):
    out = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    path = os.path.join(HERE, "assets", name)
    out.save(path, "WEBP", quality=q, method=6)
    print(name, out.size, round(os.path.getsize(path) / 1024), "KB")
