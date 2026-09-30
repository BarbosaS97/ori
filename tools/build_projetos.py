"""
Gera a página "todos os projetos": projetos/index.html (endereço /projetos/).
Grade com um cartão por projeto (capa, letra, nome, tipo) e filtro por tipo.
Os dados vêm de projects_data.py + manifest.json: projeto novo aparece sozinho.

Rodar:  python tools/build_projetos.py     (o  python tools/build_site.py  já chama este script)
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from build_site import (PROJECTS, MANIFEST, TILE, INK, N, HERE, esc, glyph, img_tag, SYMBOL_DEF, WHATSAPP_URL)
import seo

TITLE = "Projetos — Studio Óri"
DESC = "Residências, espaços comerciais e institucionais do Studio Óri Arquitetura e Interiores. Escolha um projeto para conhecer."
TIPOS = [("todos", "Todos"), ("residencial", "Residencial"), ("comercial", "Comercial"), ("institucional", "Institucional")]

def card(i, p):
    t = TILE[p["tile"]]
    cover = MANIFEST[p["slug"]][0]
    img = img_tag(p["slug"], cover, cls="pcard__img", sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 380px",
                  alt=f"Projeto {p['name']}", pos=p["cover_pos"], hero=True)
    img = img.replace("../../assets", "../assets")     # esta página fica um nível abaixo da raiz, não dois
    if i < 2:      # as duas primeiras aparecem já na abertura
        img = img.replace('loading="lazy"', 'loading="eager"')
    return f'''        <li class="pcard" data-tipo="{esc(p["type"])}" style="--accent:{t["hex"]};--on-accent:{t["on"]};--c1:{p["tone"][0]};--c2:{p["tone"][1]}">
          <a class="pcard__link" href="{p["slug"]}/?de=lista">
            <span class="pcard__media">{img}<span class="pcard__letter" aria-hidden="true">{glyph(p)}</span></span>
            <span class="pcard__body">
              <span class="pcard__type">{esc(p["type"])} · {i + 1:02d}</span>
              <span class="pcard__name">{esc(p["name"])}</span>
              <span class="pcard__go" aria-hidden="true">ver projeto →</span>
            </span>
          </a>
        </li>'''

def page():
    cards = "\n".join(card(i, p) for i, p in enumerate(PROJECTS))
    filtros = "\n".join(
        f'        <button class="pfilter__btn" type="button" data-f="{k}" aria-pressed="{"true" if k == "todos" else "false"}">{lab}</button>'
        for k, lab in TIPOS)
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(TITLE)}</title>
  <meta name="description" content="{esc(DESC)}">
  <meta name="theme-color" content="#F3EFEC">
  <meta name="color-scheme" content="light">
  {seo.head_tags("projetos/", TITLE, DESC, "assets/og/home.jpg")}
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23974315'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../style.css">
  <link rel="stylesheet" href="../projeto.css">
  <link rel="stylesheet" href="../lista.css">
</head>
<!-- GERADO por tools/build_projetos.py — edite tools/projects_data.py e rode o script; não edite este arquivo à mão. -->
<body class="pj pl">
  <a class="skiplink" href="#conteudo">Ir para o conteúdo</a>

  <header class="pjbar" id="pjbar">
    <a class="pjbar__back" href="../"><span aria-hidden="true">←</span> <span>Início</span></a>
    <a class="brand pjbar__brand" href="../" aria-label="Studio Óri — página inicial"><span>studio</span><b>ÓRI</b></a>
    <span class="pjbar__count" aria-hidden="true">{N:02d} projetos</span>
  </header>

  <main id="conteudo">
    <section class="plhead" aria-labelledby="plTitle">
      <p class="plhead__eyebrow">portfólio</p>
      <h1 id="plTitle">Nossos <em>projetos</em></h1>
      <p class="plhead__lead">Residências, espaços comerciais e institucionais. Escolha um para ver as imagens e os detalhes.</p>
      <div class="pfilter" role="group" aria-label="Filtrar por tipo">
{filtros}
      </div>
      <p class="pfilter__status sr-only" id="plStatus" role="status" aria-live="polite"></p>
    </section>

    <section class="plgrid" aria-label="Lista de projetos">
      <ul class="plgrid__list" id="plList">
{cards}
      </ul>
    </section>

    <footer class="pjfoot">
      <a class="pjfoot__back" href="../"><span aria-hidden="true">←</span> Voltar ao início</a>
      <a class="btn btn--solid pjfoot__cta" href="{WHATSAPP_URL}" target="_blank" rel="noopener">Quero transformar o meu espaço <span aria-hidden="true">→</span><span class="sr-only"> (abre o WhatsApp em nova aba)</span></a>
    </footer>
  </main>

  {SYMBOL_DEF}
  <script src="../lista.js"></script>
</body>
</html>
'''

def run():
    open(os.path.join(HERE, "projetos", "index.html"), "w", encoding="utf-8", newline="\n").write(page())
    print("projetos/index.html gerado (todos os projetos).")

if __name__ == "__main__":
    run()
    import version_assets; version_assets.run()
