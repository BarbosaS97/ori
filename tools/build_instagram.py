"""
Gera a seção "Siga o @ori.arqui" (carrossel de Reels em cards no estilo Instagram) e a coloca no index.html,
entre <!-- INSTAGRAM:START --> e <!-- INSTAGRAM:END -->.

COMO ATUALIZAR AS CAPAS
  1. Coloque as imagens em  ../_material-original/instagram/  (fora da pasta do site) com os nomes
     reel-01.jpg … reel-05.jpg  (jpg, jpeg, png ou webp).
     Ideal: 1080×1920 (9:16) ou 1080×1440 (3:4).
  2. Rode:  python tools/build_site.py      (ou só:  python tools/build_instagram.py)
  Capas que ainda não existem aparecem como cartões provisórios (degradê + símbolo).
  Para trocar/adicionar/reordenar Reels, edite REELS abaixo.
"""
import glob, html, os, re, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from site_config import COVERS_DIR      # ../_material-original/instagram/  (as capas originais não sobem para o GitHub)
esc = html.escape

HANDLE = "ori.arqui"
PROFILE_URL = "https://www.instagram.com/ori.arqui"
# url = link do Reel; label = texto que aparece na capa (vira a descrição da imagem para leitores de tela)
REELS = [
    dict(url="https://www.instagram.com/reel/DcW_judoKde/", label="ÓRI"),
    dict(url="https://www.instagram.com/reel/DcMrChBIpnQ/", label="Quanto custa um projeto?"),
    dict(url="https://www.instagram.com/reel/Dc8mEUzBhSE/", label="Respondendo as principais dúvidas sobre arquitetura"),
    dict(url="https://www.instagram.com/reel/DdwE9kpRL0x/", label="Etapas de um projeto"),
    dict(url="https://www.instagram.com/reel/DYSIGVTuXE1/", label="Detalhes importam"),
]
# degradês dos cartões provisórios (paleta da marca)
TONES = [("#B5623A", "#7A3410"), ("#8D957E", "#5B634D"), ("#4A5A8C", "#232C4A"), ("#C9A98A", "#8A5A3A"), ("#3A3A3A", "#151515")]

# ---------------------------------------------------------------------------
# ícones de linha (24×24)
# ---------------------------------------------------------------------------
def svg(inner, cls="", size=24, fill="none", sw="1.6"):
    c = f' class="{cls}"' if cls else ""
    return (f'<svg{c} viewBox="0 0 24 24" width="{size}" height="{size}" fill="{fill}" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{inner}</svg>')
HEART = svg('<path d="M19.5 12.572 12 20l-7.5-7.428a5 5 0 1 1 7.5-6.566 5 5 0 1 1 7.5 6.572"/>')
COMMENT = svg('<path d="M3 20l1.3-3.9a9 8 0 1 1 3.4 2.9L3 20"/>')
SEND = svg('<path d="M10 14 21 3"/><path d="M21 3l-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1L21 3"/>')
SAVE = svg('<path d="M9 4h6a2 2 0 0 1 2 2v14l-5-3-5 3V6a2 2 0 0 1 2-2"/>')
DOTS = svg('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>', "igcard__dots", 22, sw="2")
REEL = svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M3.5 9h17M9 3.5 11.5 9M14.5 3.5 17 9"/><path d="m10.3 12.7 4 2.3-4 2.3z" fill="currentColor" stroke="none"/>', "igcard__reel", 22)
INSTA = svg('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5v.01"/>', "ig__glyph", 26)
ARROW_L = svg('<path d="M15 5l-7 7 7 7"/>', "", 22)
ARROW_R = svg('<path d="M9 5l7 7-7 7"/>', "", 22)

def leaf(cls):
    return f'<svg class="{cls}" viewBox="0 0 1996 1969" aria-hidden="true" focusable="false"><use href="#simbolo"/></svg>'

# ---------------------------------------------------------------------------
# capas: procura instagram/reel-0N.* e gera versões otimizadas em assets/instagram/
# ---------------------------------------------------------------------------
def find_cover(n):
    for ext in ("jpg", "jpeg", "png", "webp"):
        p = os.path.join(COVERS_DIR, f"reel-{n:02d}.{ext}")
        if os.path.isfile(p):
            return p
    return None

def optimize(n, src):
    """gera assets/instagram/reel-0N.webp (1080 px) e reel-0N-s.webp (640 px); devolve (w_big, h_big, w_small)"""
    from PIL import Image, ImageOps
    out = os.path.join(HERE, "assets", "instagram"); os.makedirs(out, exist_ok=True)
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    sizes = []
    for name, w, q in ((f"reel-{n:02d}.webp", 1080, 80), (f"reel-{n:02d}-s.webp", 640, 76)):
        w = min(w, im.width)
        o = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        o.save(os.path.join(out, name), "WEBP", quality=q, method=6)
        sizes.append(o.size)
    return sizes[0][0], sizes[0][1], sizes[1][0]

def media(n, i, label):
    src = find_cover(n)
    if src:
        w, h, sw = optimize(n, src)
        base = f"assets/instagram/reel-{n:02d}"
        return (f'<img src="{base}-s.webp" srcset="{base}-s.webp {sw}w, {base}.webp {w}w" sizes="(max-width: 700px) 78vw, 300px" '
                f'width="{w}" height="{h}" alt="Capa do Reel: {esc(label)}" loading="lazy" decoding="async">'), True
    a, b = TONES[i % len(TONES)]
    return (f'<div class="igcard__ph" style="--c1:{a};--c2:{b}" role="img" aria-label="Capa do Reel {n} (imagem provisória)">'
            f'{leaf("igcard__phleaf")}<span>reel {n:02d}</span></div>'), False

# ---------------------------------------------------------------------------
def card(i, reel):
    n = i + 1
    url, label = reel["url"], reel["label"]
    m, _ = media(n, i, label)
    return f'''          <li class="ig__item" style="--i:{i}">
            <a class="igcard" href="{esc(url)}" target="_blank" rel="noopener" aria-label="Reel {n} de @{HANDLE}: {esc(label)} (abre em nova aba)">
              <span class="igcard__head">
                <span class="igcard__avatar">{leaf("igcard__avatarleaf")}</span>
                <span class="igcard__who"><b>{HANDLE}</b><small>Reel</small></span>
                {DOTS}
              </span>
              <span class="igcard__media">{m}{REEL}</span>
              <span class="igcard__actions" aria-hidden="true">{HEART}{COMMENT}{SEND}<i></i>{SAVE}</span>
              <span class="igcard__cta">Ver no Instagram <span aria-hidden="true">→</span></span>
            </a>
          </li>'''

def section():
    cards = "\n".join(card(i, r) for i, r in enumerate(REELS))
    return f'''<!-- INSTAGRAM:START (gerado por tools/build_instagram.py — capas em instagram/reel-01.jpg …) -->
    <!-- INSTAGRAM: vitrine "Siga o @{HANDLE}" — carrossel de Reels em cards no estilo Instagram. Rolagem horizontal
         (toque, arrastar com o mouse, setas). Cada card abre o Reel no Instagram. -->
    <section class="ig" id="instagram" aria-labelledby="igTitle">
      {leaf("ig__bgleaf")}
      <div class="ig__inner">
        <header class="ig__head">
          <div class="ig__headtext">
            <p class="eyebrow">instagram</p>
            <h2 id="igTitle">Siga o <em>@<span class="ori">ori</span>.arqui</em></h2>
            <p class="ig__lead">Acompanhe os projetos e o dia a dia do studio.</p>
          </div>
          <div class="ig__side">
            <a class="btn btn--light" href="{PROFILE_URL}" target="_blank" rel="noopener">Seguir no Instagram <span class="sr-only">(abre em nova aba)</span><span aria-hidden="true">→</span></a>
            <div class="ig__controls" aria-label="Navegar pelos Reels">
              <button class="ig__arrow" id="igPrev" type="button" aria-label="Reels anteriores">{ARROW_L}</button>
              <button class="ig__arrow" id="igNext" type="button" aria-label="Próximos Reels">{ARROW_R}</button>
            </div>
          </div>
        </header>

        <div class="ig__viewport">
          <ul class="ig__track" id="igTrack" tabindex="0" aria-label="Reels do Instagram @{HANDLE}">
{cards}
          </ul>
        </div>
        <div class="ig__progress" aria-hidden="true"><i id="igBar"></i></div>
      </div>
    </section>
    <!-- INSTAGRAM:END -->
'''

def patch_home():
    path = os.path.join(HERE, "index.html")
    h = open(path, encoding="utf-8").read()
    block = section()
    if "<!-- INSTAGRAM:START" in h:
        h = re.sub(r"<!-- INSTAGRAM:START.*?<!-- INSTAGRAM:END -->\n", lambda m: block, h, flags=re.S)
    else:                                   # primeira execução: entra logo depois da seção "Sobre"
        i = h.index("  </main>")
        h = h[:i] + "\n    " + block + h[i:]
    open(path, "w", encoding="utf-8").write(h)

def run():
    patch_home()
    found = [n for n in range(1, len(REELS) + 1) if find_cover(n)]
    print(f"seção do Instagram gerada: {len(found)} de {len(REELS)} capas encontradas em _material-original/instagram/ (as demais ficam provisórias).")

if __name__ == "__main__":
    run()
    sys.path.insert(0, os.path.dirname(__file__))
    import version_assets; version_assets.run()
