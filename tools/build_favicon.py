"""
Gera os ícones do site a partir do símbolo das folhas (assets/simbolo-ori.svg):
  favicon.ico (16/32/48), favicon-32.png, apple-touch-icon.png (180)  — ficam na raiz do site.
Rodar:  python tools/build_favicon.py
"""
import os, re
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TERRA, BG = (151, 67, 21), (243, 239, 236)

def subpaths():
    svg = open(os.path.join(HERE, "assets", "simbolo-ori.svg"), encoding="utf-8").read()
    vb = [float(x) for x in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    d = re.search(r' d="([^"]+)"', svg).group(1)
    subs = []
    for part in re.split(r"[Zz]", d):
        pts = [(float(x), float(y)) for x, y in re.findall(r"(-?\d+\.?\d*)[ ,]+(-?\d+\.?\d*)", part)]
        if len(pts) > 2: subs.append(pts)
    return vb, subs

def render(size, pad=0.16):
    vb, subs = subpaths()
    S = size * 4                                    # supersampling
    im = Image.new("RGB", (S, S), BG)
    dr = ImageDraw.Draw(im)
    w, h = vb[2], vb[3]
    k = S * (1 - 2 * pad) / max(w, h)
    ox, oy = (S - w * k) / 2, (S - h * k) / 2
    for n, pts in enumerate(subs):                  # 1º contorno cheio, os seguintes são "furos" (even-odd)
        dr.polygon([(ox + (x - vb[0]) * k, oy + (y - vb[1]) * k) for x, y in pts], fill=TERRA if n == 0 else BG)
    return im.resize((size, size), Image.LANCZOS)

if __name__ == "__main__":
    render(180, .2).save(os.path.join(HERE, "apple-touch-icon.png"), optimize=True)
    render(32).save(os.path.join(HERE, "favicon-32.png"), optimize=True)
    render(48).save(os.path.join(HERE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    print("favicon.ico, favicon-32.png e apple-touch-icon.png gerados.")
