"""
Gera a página de links (estilo "link na bio") em links/index.html.
Os links vêm do Linktree da Studio Óri (linktr.ee/ori.arqui). Para mudar/adicionar/reordenar, edite LINKS aqui e rode:

    python tools/build_links.py

O botão com primary=True ganha destaque (preenchido). Não há JavaScript: a animação é só CSS.
"""
import glob, html, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
from site_config import WHATSAPP_URL, COVERS_DIR      # o mesmo link de WhatsApp de todos os botões de conversão do site
import seo

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
esc = html.escape

# ---------------------------------------------------------------------------
# DADOS  (origem: Linktree ori.arqui)
# ---------------------------------------------------------------------------
LINKS = [
    dict(icon="briefcase", title="Site & Portfólio", sub="conheça nossos projetos",
         url="https://oriarquitetura.com.br/"),
    dict(icon="list", title="Orçamentos", sub="conte sobre o seu projeto",
         url="https://zsdp96qk.forms.app/studioori"),
    dict(icon="whatsapp", title="Fale conosco", sub="WhatsApp · (61) 98236-7700",
         url=WHATSAPP_URL, primary=True),
    dict(icon="instagram", title="Instagram", sub="@ori.arqui",
         url="https://www.instagram.com/ori.arqui"),
    dict(icon="facebook", title="Facebook", sub="Studio Óri",
         url="https://www.facebook.com/people/Studio-%C3%93ri/61573346091668/"),
]

# ícones de linha (24×24, traço herda a cor do texto)
ICONS = {
    "briefcase": '<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    "list": '<rect x="4" y="4" width="16" height="6" rx="2"/><rect x="4" y="14" width="16" height="6" rx="2"/>',
    "whatsapp": '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
    "instagram": '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5v.01"/>',
    "facebook": '<path d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2z"/>',
}
ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# símbolo das 5 folhas (o mesmo <symbol> do site)
_sym = open(os.path.join(HERE, "assets", "simbolo-ori.svg"), encoding="utf-8").read()
_vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', _sym).groups()
_d = re.search(r' d="([^"]+)"', _sym).group(1)
SYMBOL_DEF = (f'<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'
              f'<symbol id="simbolo" viewBox="0 0 {_vb[0]} {_vb[1]}"><path fill="currentColor" fill-rule="evenodd" d="{_d}"/></symbol></svg>')
def leaf(cls): return f'<svg class="{cls}" viewBox="0 0 {_vb[0]} {_vb[1]}" aria-hidden="true" focusable="false"><use href="#simbolo"/></svg>'

def item(i, l):
    rel = ' rel="noopener"' if l["url"].startswith("http") else ""
    return f'''        <li style="--i:{i}">
          <a class="lk__item{" lk__item--primary" if l.get("primary") else ""}" href="{esc(l["url"])}" target="_blank"{rel}>
            <svg class="lk__icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{ICONS[l["icon"]]}</svg>
            <span class="lk__text"><strong>{esc(l["title"])}</strong><small>{esc(l["sub"])}</small></span>
            <span class="lk__go" aria-hidden="true">{ARROW}</span>
          </a>
        </li>'''

# Foto do topo: a capa original do Reel 1 (_material-original/instagram/reel-01.*). As versões otimizadas ficam em assets/ e vão para o
# GitHub; o original (pesado) não. Se o original não estiver na máquina, usa as versões já geradas.
PHOTO = {"w": 1080, "h": 1920}
def prepare_photo():
    src = next((p for ext in ("png", "jpg", "jpeg", "webp") for p in glob.glob(os.path.join(COVERS_DIR, f"reel-01.{ext}"))), None)
    if not src:
        return
    from PIL import Image, ImageOps
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    for name, w, q in (("links-foto.webp", 1080, 80), ("links-foto-s.webp", 640, 76)):
        w = min(w, im.width)
        out = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        out.save(os.path.join(HERE, "assets", name), "WEBP", quality=q, method=6)
        if name == "links-foto.webp":
            PHOTO["w"], PHOTO["h"] = out.size

def build():
    items = "\n".join(item(i, l) for i, l in enumerate(LINKS))
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Studio Óri — Links</title>
  <meta name="description" content="Studio Óri · Arquitetura e Interiores. Portfólio, orçamentos, WhatsApp e redes sociais.">
  <meta name="theme-color" content="#F3EFEC">
  <meta name="color-scheme" content="light">
  {seo.head_tags("links/", "Studio Óri — Links", "Studio Óri · Arquitetura e Interiores. Portfólio, orçamentos, WhatsApp e redes sociais.", "assets/og/home.jpg")}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23974315'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../links.css">
</head>
<!-- GERADO por tools/build_links.py — edite os links lá e rode o script; não edite este arquivo à mão. -->
<body class="lk">
  <!-- símbolo gigante e apagado ao fundo -->
  <div class="lk__bg" aria-hidden="true">{leaf("lk__bgleaf")}</div>

  <main class="lk__wrap">
    <a class="lk__back" href="../">← voltar ao site</a>
    <header class="lk__head">
      <h1 class="sr-only">Studio Óri — Arquitetura e Interiores</h1>

      <!-- foto das arquitetas em moldura de arco -->
      <figure class="lk__arch">
        <img src="../assets/links-foto-s.webp" srcset="../assets/links-foto-s.webp 640w, ../assets/links-foto.webp 1080w"
             sizes="200px" width="{PHOTO["w"]}" height="{PHOTO["h"]}" fetchpriority="high" decoding="async"
             alt="Malu e Laura, arquitetas do Studio Óri, em retrato com a marca ÓRI ao fundo">
      </figure>

      <!-- logotipo: "studio" pequeno + ÓRI grande, com o símbolo acima -->
      {leaf("lk__mark")}
      <p class="lk__brand" aria-hidden="true"><span>studio</span><b class="wm" role="img" aria-label="Óri"></b></p>
      <p class="lk__role">arquitetura e interiores</p>
      <p class="lk__slogan">Valorizamos história e <em>ori</em>ginalidade.</p>
    </header>

    <nav aria-label="Links do Studio Óri">
      <ul class="lk__list">
{items}
      </ul>
    </nav>

    <footer class="lk__foot">
      {leaf("lk__footleaf")}
      <p>Studio Óri · Arquitetura e Interiores</p>
    </footer>
  </main>

  {SYMBOL_DEF}
</body>
</html>
'''

if __name__ == "__main__":
    prepare_photo()
    d = os.path.join(HERE, "links"); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(build())
    sys.path.insert(0, os.path.dirname(__file__))
    import version_assets; version_assets.run()          # cache busting (?v=hash)
    print("links/index.html gerado.")
