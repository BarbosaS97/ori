"""
Gera, a partir de projects_data.py + manifest.json:
  1. as 9 páginas  projetos/<slug>/index.html
  2. o bloco "PROJETOS" da Home (entre <!-- PROJETOS:START --> e <!-- PROJETOS:END --> em index.html)

Rodar (na pasta do projeto):  python tools/build_site.py
Não precisa das fotos originais: usa assets/projetos/ e tools/manifest.json.
"""
import html, json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
from projects_data import PROJECTS, TILE
from site_config import WHATSAPP_URL
import seo

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = json.load(open(os.path.join(HERE, "tools", "manifest.json")))
N = len(PROJECTS)
esc = html.escape

# tom mais escuro do tile, usado em TEXTO sobre fundo claro (o sálvia puro não tem contraste)
INK = {"terracota": "#974315", "salvia": "#5B634D", "azul": "#313D65", "grafite": "#1F1F1F"}

# símbolo das 5 folhas (mesmo <symbol> da Home), para o "O" de STUDIO
_sym = open(os.path.join(HERE, "assets", "simbolo-ori.svg"), encoding="utf-8").read()
_vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', _sym).groups()
_d = re.search(r' d="([^"]+)"', _sym).group(1)
SYMBOL_DEF = (f'<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">'
              f'<symbol id="simbolo" viewBox="0 0 {_vb[0]} {_vb[1]}"><path fill="currentColor" fill-rule="evenodd" d="{_d}"/></symbol></svg>')
SYM_USE = f'<svg class="glyph glyph--sym" viewBox="0 0 {_vb[0]} {_vb[1]}" aria-hidden="true"><use href="#simbolo"/></svg>'

def glyph(p):
    return SYM_USE if p.get("symbol") else f'<span class="glyph">{esc(p["letter"])}</span>'

def img_tag(slug, it, cls="", sizes="100vw", alt="", pos=None, eager=False, hero=False):
    base = f"assets/projetos/{slug}/{it['n']:02d}"
    pre = "../../" if hero else ""
    style = f' style="object-position:{pos}"' if pos else ""
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<img{f" class=\"{cls}\"" if cls else ""} src="{pre}{base}-s.webp" '
            f'srcset="{pre}{base}-s.webp {it["sw"]}w, {pre}{base}.webp {it["w"]}w" sizes="{sizes}" '
            f'width="{it["w"]}" height="{it["h"]}" alt="{esc(alt)}" {load} decoding="async"{style}>')

# Foto que só começa a baixar quando o projetos.js pede (perto da seção ou ao avançar até ela).
# Sem isso o navegador carregava as 9 capas logo na abertura, competindo com o hero.
PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
def deferred_img(slug, it, sizes, alt, pos):
    base = f"assets/projetos/{slug}/{it['n']:02d}"
    return (f'<img src="{PLACEHOLDER}" data-src="{base}-s.webp" '
            f'data-srcset="{base}-s.webp {it["sw"]}w, {base}.webp {it["w"]}w" sizes="{sizes}" '
            f'width="{it["w"]}" height="{it["h"]}" alt="{esc(alt)}" decoding="async" style="object-position:{pos}">')

ARROW_L = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_R = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# ---------------------------------------------------------------------------
# 1) PÁGINA DE PROJETO
# ---------------------------------------------------------------------------
def page(i):
    p = PROJECTS[i]
    prev, nxt = PROJECTS[(i - 1) % N], PROJECTS[(i + 1) % N]
    items = MANIFEST[p["slug"]]
    cover, gallery = items[0], items[1:]
    t = TILE[p["tile"]]
    name = esc(p["name"])
    back = f'../../?ativo={p["slug"]}#projetos'

    gal = "\n".join(
        f'''          <li class="pjgal__li pjgal__li--{"wide" if it["w"] >= it["h"] else "tall"}">
            <button class="pjgal__item" type="button" data-i="{k}" data-full="../../assets/projetos/{p["slug"]}/{it["n"]:02d}.webp" data-w="{it["w"]}" data-h="{it["h"]}" aria-label="Ampliar imagem {k + 1} de {len(gallery)}">
              {img_tag(p["slug"], it, sizes="(max-width: 700px) 100vw, 50vw", alt=f"{p['name']}, imagem {k + 1}", hero=True)}
            </button>
          </li>''' for k, it in enumerate(gallery))

    nxt_cover = MANIFEST[nxt["slug"]][0]
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{name} — Studio Óri</title>
  <meta name="description" content="{esc(p["lead"])}">
  <meta name="theme-color" content="{t["hex"]}">
  <meta name="color-scheme" content="light">
  {seo.head_tags(f"projetos/{p['slug']}/", f"{p['name']} — Studio Óri", p["lead"], f"assets/og/{p['slug']}.jpg")}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23974315'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../style.css">
  <link rel="stylesheet" href="../../projeto.css">
</head>
<!-- GERADO por tools/build_site.py — edite tools/projects_data.py e rode o script; não edite este arquivo à mão. -->
<body class="pj" style="--accent:{t["hex"]};--on-accent:{t["on"]};--ink:{INK[p["tile"]]};--c1:{p["tone"][0]};--c2:{p["tone"][1]}">
  <a class="skiplink" href="#conteudo">Ir para o conteúdo</a>

  <!-- Barra: voltar, marca e setas entre projetos -->
  <header class="pjbar" id="pjbar">
    <a class="pjbar__back" href="{back}"><span aria-hidden="true">←</span> <span>Projetos</span></a>
    <a class="brand brand--mark pjbar__brand" href="../../" aria-label="Studio Óri — página inicial"><svg class="brand__leaf" viewBox="0 0 1996 1969" aria-hidden="true" focusable="false"><use href="#simbolo"/></svg><b class="wm" role="img" aria-label="Óri"></b></a>
    <nav class="pjbar__pn" aria-label="Navegar entre projetos">
      <a class="pjarrow" rel="prev" href="../{prev["slug"]}/" aria-label="Projeto anterior: {esc(prev["name"])}">{ARROW_L}</a>
      <span class="pjbar__count" aria-label="Projeto {i + 1} de {N}">{i + 1:02d} / {N:02d}</span>
      <a class="pjarrow" rel="next" href="../{nxt["slug"]}/" aria-label="Próximo projeto: {esc(nxt["name"])}">{ARROW_R}</a>
    </nav>
  </header>

  <!-- Setas laterais (desktop): mostram o nome do projeto vizinho ao passar o mouse -->
  <a class="pjside pjside--prev" href="../{prev["slug"]}/" aria-hidden="true" tabindex="-1"><span class="pjarrow">{ARROW_L}</span><span class="pjside__name">{esc(prev["name"])}</span></a>
  <a class="pjside pjside--next" href="../{nxt["slug"]}/" aria-hidden="true" tabindex="-1"><span class="pjside__name">{esc(nxt["name"])}</span><span class="pjarrow">{ARROW_R}</span></a>

  <main id="conteudo">
    <!-- Topo: capa em tela cheia, com o bloco-letra do projeto -->
    <section class="pjhero" aria-labelledby="pjTitle">
      <div class="pjhero__media">
        {img_tag(p["slug"], cover, cls="pjhero__img", sizes="100vw", alt=f"Render do projeto {p['name']}", pos=p["cover_pos"], eager=True, hero=True)}
      </div>
      <div class="pjhero__shade" aria-hidden="true"></div>
      <div class="pjhero__inner">
        <div class="pjhero__letter" aria-hidden="true">{glyph(p)}</div>
        <p class="pjhero__eyebrow">{esc(p["type"])} · projeto {i + 1:02d}</p>
        <h1 id="pjTitle">{name}</h1>
        <p class="pjhero__lead">{esc(p["lead"])}</p>
      </div>
      <a class="pjhero__cue" href="#galeria"><span>ver o projeto</span><i aria-hidden="true"></i></a>
    </section>

    <!-- Ficha -->
    <section class="pjmeta" aria-label="Ficha do projeto">
      <dl>
        <div><dt>tipo</dt><dd>{esc(p["type"])}</dd></div>
        <div><dt>imagens</dt><dd>{len(items)}</dd></div>
        <div><dt>formato</dt><dd>renders 3D do projeto</dd></div>
        <div><dt>autoria</dt><dd>Studio Óri Arquitetura e Interiores</dd></div>
      </dl>
    </section>

    <!-- Galeria (clique abre a visualização ampliada com setas) -->
    <section class="pjgal" id="galeria" aria-labelledby="galTitle">
      <h2 id="galTitle" class="sr-only">Galeria de imagens de {name}</h2>
      <ul class="pjgal__grid">
{gal}
      </ul>
    </section>

    <!-- Próximo projeto -->
    <section class="pjnext" aria-label="Próximo projeto" style="--n1:{nxt["tone"][0]};--n2:{nxt["tone"][1]}">
      <a class="pjnext__link" href="../{nxt["slug"]}/">
        <span class="pjnext__bg" aria-hidden="true">{img_tag(nxt["slug"], nxt_cover, sizes="100vw", pos=nxt["cover_pos"], hero=True)}</span>
        <span class="pjnext__body">
          <span class="pjnext__label">próximo projeto</span>
          <span class="pjnext__name">{esc(nxt["name"])}</span>
          <span class="pjnext__go">ver <span class="pjarrow" aria-hidden="true">{ARROW_R}</span></span>
        </span>
      </a>
    </section>

    <footer class="pjfoot">
      <a class="pjfoot__back" href="{back}"><span aria-hidden="true">←</span> Voltar aos projetos</a>
      <a class="pjfoot__back pjfoot__all" href="../"><span>Todos os projetos</span> <span aria-hidden="true">→</span></a>
      <a class="btn btn--solid pjfoot__cta" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Quero transformar o meu espaço <span aria-hidden="true">→</span><span class="sr-only"> (abre o WhatsApp em nova aba)</span></a>
    </footer>
  </main>

  <!-- Visualização ampliada da galeria -->
  <dialog class="lb" id="lb" aria-label="Galeria de imagens">
    <button class="lb__btn lb__close" type="button" aria-label="Fechar">×</button>
    <button class="lb__btn lb__prev" type="button" aria-label="Imagem anterior">{ARROW_L}</button>
    <figure class="lb__fig"><img class="lb__img" alt=""><figcaption class="lb__cap" aria-live="polite"></figcaption></figure>
    <button class="lb__btn lb__next" type="button" aria-label="Próxima imagem">{ARROW_R}</button>
  </dialog>

  {SYMBOL_DEF}
  <script src="../../vendor/gsap.min.js"></script>
  <script src="../../vendor/ScrollTrigger.min.js"></script>
  <script src="../../projeto.js"></script>
</body>
</html>
'''

# ---------------------------------------------------------------------------
# 2) BLOCO "PROJETOS" DA HOME
# ---------------------------------------------------------------------------
def home_block():
    TILES = [p["tile"] for p in PROJECTS]
    def tile(i, p):
        label = f'Letra {p["letter"]}: {p["name"]}, projeto {p["type"]}. Ver projeto'
        return (f'            <a class="tile{" is-active" if i == 0 else ""}" href="projetos/{p["slug"]}/" data-i="{i}" data-slug="{p["slug"]}" '
                f'data-tile="{TILES[i]}" aria-label="{esc(label)}"{" aria-current=\"true\"" if i == 0 else ""}>\n'
                f'              <span class="tile__face">{glyph(p)}<span class="tile__bar" aria-hidden="true"><i></i></span></span>\n'
                f'            </a>')
    def pv(i, p):
        cover = MANIFEST[p["slug"]][0]
        return f'''          <figure class="pv{" is-active" if i == 0 else ""}" data-i="{i}" style="--c1:{p["tone"][0]};--c2:{p["tone"][1]}">
            <div class="pv__img">
              {deferred_img(p["slug"], cover, sizes="(max-width: 860px) 100vw, 46vw", alt=f"Render do projeto {p['name']}", pos=p["cover_pos"])}
            </div>
            <figcaption class="pv__cap">
              <span class="pv__num">{i + 1:02d}</span>
              <small>{esc(p["type"])}</small>
              <strong>{esc(p["name"])}</strong>
              <span class="pv__cta">ver projeto <span aria-hidden="true">→</span></span>
            </figcaption>
            <a class="pv__link" href="projetos/{p["slug"]}/" tabindex="-1" aria-hidden="true"></a>
            <!-- carregamento (mesma linguagem do loader do site): some quando a foto do projeto termina de carregar -->
            <div class="pv__loader" aria-hidden="true"><span class="brand brand--lg"><span>studio</span><b class="wm" role="img" aria-label="Óri"></b></span><i></i></div>
          </figure>'''
    row1 = "\n".join(tile(i, PROJECTS[i]) for i in range(6))
    row2 = "\n".join(tile(i, PROJECTS[i]) for i in range(6, 9))
    pvs = "\n".join(pv(i, PROJECTS[i]) for i in range(N))
    return f'''<!-- PROJETOS:START (gerado por tools/build_site.py — edite tools/projects_data.py) -->
    <!-- PROJETOS: o nome "STUDIO ÓRI" já formado. Cada letra é um projeto:
         passar o mouse / focar / tocar mostra o projeto no painel ao lado; clicar abre a página do projeto.
         projetos.js só adiciona o comportamento. -->
    <section class="letters" id="projetos" aria-labelledby="lettersTitle">
      <header class="letters__head">
        <p class="eyebrow">projetos</p>
        <h2 id="lettersTitle">Cada letra, um projeto.<br>Cada projeto, uma <em>conversa</em>.</h2>
        <p class="letters__hint" id="lettersHint">Passe o mouse sobre uma letra para ver o projeto.</p>
      </header>

      <div class="lx">
        <!-- O nome: 6 letras (STUDIO) + 3 (ÓRI). O "O" de STUDIO é o símbolo das folhas. -->
        <div class="word" id="word" role="group" aria-label="STUDIO ÓRI — um projeto por letra">
          <div class="word__row">
{row1}
          </div>
          <div class="word__row">
{row2}
          </div>
        </div>

        <!-- Painel de pré-visualização: um <figure> por projeto, empilhados; projetos.js faz a transição -->
        <div class="pvbox">
          <div class="pvframe" id="pvFrame">
{pvs}
            <!-- setas laterais (só no celular): projeto anterior / próximo, mudando a letra ativa -->
            <button class="pvnav pvnav--prev" id="pvPrev" type="button" aria-label="Projeto anterior">{ARROW_L}</button>
            <button class="pvnav pvnav--next" id="pvNext" type="button" aria-label="Próximo projeto">{ARROW_R}</button>
          </div>
          <div class="pvbar">
            <span class="pvbar__count" aria-hidden="true"><b id="pvCount">01</b> / 09</span>
            <button class="pvbar__auto" id="autoBtn" type="button" aria-pressed="false">pausar</button>
          </div>
        </div>
      </div>

      <div class="cta" id="cta">
        <div class="cta__row">
          <a class="btn btn--solid" href="projetos/">Conheça os projetos <span aria-hidden="true">→</span></a>
          <a class="btn btn--ghost" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Quero transformar o meu espaço<span class="sr-only"> (abre o WhatsApp em nova aba)</span></a>
        </div>
      </div>
    </section>
    <!-- PROJETOS:END -->
'''

def patch_home():
    path = os.path.join(HERE, "index.html")
    h = open(path, encoding="utf-8").read()
    block = home_block()
    if "<!-- PROJETOS:START" in h:
        h = re.sub(r"<!-- PROJETOS:START.*?<!-- PROJETOS:END -->\n", lambda m: block.lstrip(), h, flags=re.S)
    else:  # primeira execução: substitui a seção escrita à mão
        i0 = h.index("    <!-- PROJETOS: o nome")
        i1 = h.index("    <!-- SERVIÇOS")
        h = h[:i0] + "    " + block + "\n" + h[i1:]
    open(path, "w", encoding="utf-8").write(h)

if __name__ == "__main__":
    for i, p in enumerate(PROJECTS):
        d = os.path.join(HERE, "projetos", p["slug"]); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(page(i))
    patch_home()
    print(f"{N} páginas em projetos/ e bloco da Home atualizado.")
    import build_historia; build_historia.run()     # página /historia/ (nossa história)
    import build_projetos; build_projetos.run()     # página /projetos/ (todos os projetos, com filtro)
    import build_instagram; build_instagram.run()   # seção do Instagram (capas em _material-original/instagram/)
    import build_seo; build_seo.run()               # título/canônico/compartilhamento da Home, 404, endereços curtos, robots, sitemap
    import version_assets; version_assets.run()      # cache busting: style.css?v=hash ...
