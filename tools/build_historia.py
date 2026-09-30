"""
Gera a página "Nossa história": historia/index.html (endereço /historia/).
O texto fica em BLOCOS abaixo — para mudar uma frase, edite aqui e rode:  python tools/build_historia.py
(o  python tools/build_site.py  também chama este script).
"""
import html, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from site_config import WHATSAPP_URL, SITE_NAME
from build_site import SYMBOL_DEF
import seo

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
esc = html.escape

TITLE = f"Nossa história — {SITE_NAME}"
DESC = "Amigas desde os 12 anos, Malu e Laura fundaram o Studio Óri em 2026. Conheça a nossa história e o que significa valorizar história e originalidade."

# ---------------------------------------------------------------------------
# TEXTO (frases entre <em>…</em> ganham destaque terracota)
# ---------------------------------------------------------------------------
ABERTURA = [
    "Nos conhecemos na escola, aos 12 anos. O tempo passou, mantivemos contato, mas foi na faculdade de arquitetura que nos reaproximamos de verdade.",
    "Foi nos estágios, trabalhando juntas, que percebemos o quanto a nossa parceria dava certo. Nossas diferenças se complementavam de forma natural, unidas por um mesmo propósito.",
]
DESTAQUE = "Nos formamos em 2025. O Studio Óri nasceu em 2026."
CONTINUACAO = [
    "Abrir o escritório juntas não foi uma decisão difícil. Como já trabalhávamos lado a lado, sabíamos que daria certo. Tivemos várias ideias, fizemos reuniões, e mergulhamos de cabeça nesse sonho.",
]
SECOES = [
    ("Por que “<em>Óri</em>”?",
     ["O nome veio da vontade de representar aquilo que está na origem de cada projeto: a história, os desejos e a personalidade de quem vai viver aquele espaço."]),
    ("O que “valorizar história e originalidade” significa para nós",
     ["É valorizar as origens e a personalidade de cada cliente, criando espaços com identidade e significado, espaços que vão além das tendências."]),
]

def hl(s):
    """Destaca em outra cor todo "óri"/"ori" das palavras (história, originalidade, origens, Óri...)."""
    return re.sub(r"([óÓoO][rR][iI])", r'<span class="ori">\1</span>', s)

def paras(lst):
    return "\n".join(f"        <p>{hl(t)}</p>" for t in lst)

def page():
    secoes = "\n".join(f'''      <section class="hs__sec">
        <h2>{h if "<em>" in h else hl(h)}</h2>
{paras(ps)}
      </section>''' for h, ps in SECOES)
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(TITLE)}</title>
  <meta name="description" content="{esc(DESC)}">
  <meta name="theme-color" content="#F3EFEC">
  <meta name="color-scheme" content="light">
  {seo.head_tags("historia/", TITLE, DESC, "assets/og/home.jpg")}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23974315'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../projeto.css">
  <link rel="stylesheet" href="../historia.css">
</head>
<!-- GERADO por tools/build_historia.py — edite o texto nesse script e rode-o; não edite este arquivo à mão. -->
<body class="pj hs">
  <a class="skiplink" href="#conteudo">Ir para o conteúdo</a>

  <header class="pjbar" id="pjbar">
    <a class="pjbar__back" href="../#sobre"><span aria-hidden="true">←</span> <span>Voltar</span></a>
    <a class="brand brand--mark pjbar__brand" href="../" aria-label="Studio Óri — página inicial"><svg class="brand__leaf" viewBox="0 0 1996 1969" aria-hidden="true" focusable="false"><use href="#simbolo"/></svg><b class="wm" role="img" aria-label="Óri"></b></a>
  </header>

  <main id="conteudo">
    <section class="hs__hero" aria-labelledby="hsTitle">
      <div class="hs__intro">
        <p class="hs__eyebrow">{hl("nossa história")}</p>
        <h1 id="hsTitle">Amigas desde os <em>12&nbsp;anos</em>.</h1>
      </div>
      <figure class="hs__media">
        <img src="../assets/sobre-nos-s.webp" srcset="../assets/sobre-nos-s.webp 900w, ../assets/sobre-nos.webp 1600w"
             sizes="(max-width: 860px) 86vw, 460px" width="1600" height="2400" fetchpriority="high" decoding="async"
             alt="Malu e Laura, arquitetas do Studio Óri, sentadas no chão com amostras de materiais e plantas de projeto">
      </figure>
    </section>

    <div class="hs__body">
      <section class="hs__sec hs__sec--lead">
{paras(ABERTURA)}
      </section>

      <p class="hs__quote">{hl(esc(DESTAQUE))}</p>

      <section class="hs__sec">
{paras(CONTINUACAO)}
      </section>

{secoes}
    </div>

    <footer class="pjfoot">
      <a class="pjfoot__back" href="../#sobre"><span aria-hidden="true">←</span> Voltar</a>
      <a class="btn btn--solid pjfoot__cta" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Quero transformar o meu espaço <span aria-hidden="true">→</span><span class="sr-only"> (abre o WhatsApp em nova aba)</span></a>
    </footer>
  </main>

  {SYMBOL_DEF}
</body>
</html>
'''

def run():
    d = os.path.join(HERE, "historia"); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8", newline="\n").write(page())
    print("historia/index.html gerado (nossa história).")

if __name__ == "__main__":
    run()
    import version_assets; version_assets.run()
