"""
Gera o que faz as URLs do site funcionarem bem quando ele vai ao ar:

  • assets/og/*.jpg      imagens 1200x630 de pré-visualização (WhatsApp, Instagram, Facebook…) — Home + 1 por projeto
  • <head> da Home       título, descrição, endereço canônico e tags de compartilhamento (entre <!-- SEO:START/END -->)
  • 404.html             página de "não encontrada" com a cara do site (usa <base> para funcionar em qualquer caminho)
  • link/  contato/  wpp/  endereços curtos que redirecionam (ver ALIASES em site_config.py)
  • robots.txt           "liberado" ou "bloqueado" conforme INDEXAR em site_config.py
  • sitemap.xml          lista das páginas (só faz sentido com INDEXAR = True; é gerado sempre)
  • .nojekyll            avisa o GitHub Pages para publicar os arquivos como estão

Rodar:  python tools/build_seo.py     (o  python tools/build_site.py  já chama este script)
"""
import html, os, re, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image
from projects_data import PROJECTS
from site_config import (ALIASES, INDEXAR, LINKS_PAGE, SITE_DESC, SITE_DIR, SITE_NAME, SITE_TITLE, SITE_URL, WHATSAPP_URL)
import seo

HERE = SITE_DIR
esc = html.escape
OG_W, OG_H = 1200, 630

def w(path, text):
    full = os.path.join(HERE, path)
    os.makedirs(os.path.dirname(full) or HERE, exist_ok=True)
    open(full, "w", encoding="utf-8", newline="\n").write(text)

# ---------------------------------------------------------------------------
# 1) imagens de pré-visualização 1200x630
# ---------------------------------------------------------------------------
def og_image(src, dst, pos=(0.5, 0.5)):
    im = Image.open(os.path.join(HERE, src)).convert("RGB")
    s = max(OG_W / im.width, OG_H / im.height)
    im = im.resize((round(im.width * s) + 1, round(im.height * s) + 1), Image.LANCZOS)
    x = round((im.width - OG_W) * pos[0]); y = round((im.height - OG_H) * pos[1])
    out = os.path.join(HERE, dst); os.makedirs(os.path.dirname(out), exist_ok=True)
    im.crop((x, y, x + OG_W, y + OG_H)).save(out, "JPEG", quality=84, optimize=True, progressive=True)

def make_og():
    og_image("assets/hero-socias.jpg", "assets/og/home.jpg", (0.5, 0.42))
    for p in PROJECTS:
        py = int(p["cover_pos"].split()[1].rstrip("%")) / 100
        og_image(f"assets/projetos/{p['slug']}/01.webp", f"assets/og/{p['slug']}.jpg", (0.5, py))

# ---------------------------------------------------------------------------
# 2) <head> da Home (bloco entre marcadores)
# ---------------------------------------------------------------------------
def patch_home_head():
    path = os.path.join(HERE, "index.html")
    h = open(path, encoding="utf-8").read()
    block = (f"<!-- SEO:START (gerado por tools/build_seo.py — edite site_config.py) -->\n"
             f"  <title>{esc(SITE_TITLE)}</title>\n"
             f'  <meta name="description" content="{esc(SITE_DESC)}">\n'
             f"  {seo.head_tags('', SITE_TITLE, SITE_DESC, 'assets/og/home.jpg')}\n"
             f"  <!-- SEO:END -->")
    # recorta o bloco antigo (se houver) e apaga do resto do <head> qualquer title/description/robots solto,
    # para o bloco ser a ÚNICA fonte (sem linhas duplicadas a cada build)
    TOKEN = "@@SEO_BLOCK@@"
    if "<!-- SEO:START" in h:
        h = re.sub(r"[ \t]*<!-- SEO:START.*?<!-- SEO:END -->", TOKEN, h, count=1, flags=re.S)   # aceita qualquer recuo
    else:
        h = re.sub(r"  <title>[^<]*</title>", TOKEN, h, count=1)
    h = re.sub(r"  <title>[^<]*</title>\n", "", h)
    h = re.sub(r'  <meta name="description"[^>]*>\n', "", h)
    h = re.sub(r'  <meta name="robots"[^>]*>\n', "", h)
    h = h.replace(TOKEN, "  " + block, 1)
    open(path, "w", encoding="utf-8", newline="\n").write(h)

# ---------------------------------------------------------------------------
# 3) 404.html
# ---------------------------------------------------------------------------
def page404():
    w("404.html", f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <!-- O GitHub Pages serve esta página em QUALQUER endereço inexistente; o <base> faz os arquivos carregarem de qualquer caminho -->
  <base href="{esc(SITE_URL)}">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Página não encontrada — {esc(SITE_NAME)}</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#F3EFEC">
  <meta name="color-scheme" content="light">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23974315'/%3E%3C/svg%3E">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Jost:wght@300;400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
  <style>
    .nf {{ min-height: 100vh; min-height: 100svh; display: grid; place-content: center; justify-items: center; gap: 22px; padding: 40px 22px; text-align: center; }}
    .nf .brand {{ color: var(--terracota); }}
    .nf h1 {{ margin: 0; font-family: var(--serif); font-weight: 500; font-size: clamp(34px, 8vw, 64px); line-height: 1.05; }}
    .nf h1 em {{ color: var(--terracota); }}
    .nf p {{ margin: 0; max-width: 28rem; color: rgba(31, 31, 31, .78); }}
    .nf__row {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 8px; }}
  </style>
</head>
<body>
  <main class="nf">
    <a class="brand brand--lg" href="./" aria-label="Studio Óri — início"><span>studio</span><b class="wm" role="img" aria-label="Óri"></b></a>
    <h1>Essa página <em>não existe</em>.</h1>
    <p>O endereço pode ter mudado ou estar digitado diferente. Vamos começar de novo?</p>
    <div class="nf__row">
      <a class="btn btn--solid" href="./">Ir para o início</a>
      <a class="btn btn--ghost" href="projetos/casa-aconchego/">Ver projetos</a>
      <a class="btn btn--ghost" href="{esc(LINKS_PAGE)}">Falar com a gente</a>
    </div>
  </main>
</body>
</html>
''')

# ---------------------------------------------------------------------------
# 4) endereços curtos que redirecionam
# ---------------------------------------------------------------------------
def aliases():
    for folder, target in ALIASES.items():
        external = target.startswith("http")
        rel = target if external else "../" + target          # a pasta do alias fica um nível abaixo da raiz
        absu = target if external else SITE_URL + target
        w(f"{folder}/index.html", f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecionando… — {esc(SITE_NAME)}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="{esc(absu)}">
  <meta http-equiv="refresh" content="0; url={esc(rel)}">
  <script>location.replace({rel!r});</script>
  <style>body{{margin:0;min-height:100vh;display:grid;place-items:center;background:#F3EFEC;color:#1F1F1F;font:16px/1.5 system-ui,sans-serif}}a{{color:#974315}}</style>
</head>
<body><p>Redirecionando… <a href="{esc(rel)}">clique aqui se nada acontecer</a>.</p></body>
</html>
''')

# ---------------------------------------------------------------------------
# 5) robots.txt, sitemap.xml, .nojekyll
# ---------------------------------------------------------------------------
def robots_sitemap():
    pages = ["", "projetos/", "historia/", LINKS_PAGE] + [f"projetos/{p['slug']}/" for p in PROJECTS]
    urls = "\n".join(f"  <url><loc>{esc(SITE_URL + p)}</loc></url>" for p in pages)
    w("sitemap.xml", f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')
    if INDEXAR:
        w("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}sitemap.xml\n")
    else:
        w("robots.txt", "# Site em fase de testes: não listar nos buscadores (mude INDEXAR em tools/site_config.py no lançamento)\nUser-agent: *\nDisallow: /\n")
    w(".nojekyll", "")

def run():
    make_og(); patch_home_head(); page404(); aliases(); robots_sitemap()
    print(f"SEO/URLs: {'INDEXAÇÃO LIBERADA' if INDEXAR else 'noindex (fase de testes)'} | endereço base {SITE_URL} | 404, aliases {list(ALIASES)}, robots, sitemap, og gerados.")

if __name__ == "__main__":
    run()
    import version_assets; version_assets.run()
