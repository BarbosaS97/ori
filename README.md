# Studio Óri — protótipo do hero

Validação da animação de abertura do novo site (scroll-driven): sócias → parede off-white → portal → ambiente → desenho técnico.

HTML/CSS/JS puro + GSAP (local em `vendor/`). Sem build.

## Rodar local
    python -m http.server 8765
    # abrir http://localhost:8765  (?p=0.5 congela a animação em 50%)

## Publicar (GitHub Pages)
Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`.

## Estrutura
- `index.html`, `style.css`, `hero.js` — o hero
- `projetos.css`, `projetos.js` — seção de projetos (nome "STUDIO ÓRI" formado; cada letra abre um projeto)
- `projeto.css`, `projeto.js` — páginas de projeto; `projetos/` — páginas geradas; `tools/` — scripts de geração
- `assets/simbolo-ori.svg` — símbolo das 5 folhas (vetorizado do manual; inline no `index.html` como `<symbol id="simbolo">`)
- `assets/frames-d`, `assets/frames-m` — sequência de 201 frames (desktop / mobile vertical)
- `assets/hero-socias.*` — foto das sócias
- `tools/build_assets.py` — gera os frames a partir do vídeo (caminhos locais, não roda fora da máquina de origem)

Protótipo interno: `noindex` ativo. Vídeo gerado por IA (GPT + Google Flow), ilustração conceitual.

## Seção de projetos (`projetos.js` + `projetos.css`)

O nome **STUDIO ÓRI** já aparece formado: 9 blocos coloridos, cada um é um projeto (S T U D I O Ó R I; o "O" de STUDIO é o símbolo das folhas).

- **Desktop:** passar o mouse (ou focar com o teclado) ativa o projeto: o bloco sobe e o painel à direita troca a imagem com uma cortina. Clicar no bloco ou no painel abre o projeto. O bloco sob o cursor inclina em 3D.
- **Toque:** o 1º toque seleciona, o 2º abre.
- **Autoplay:** até o primeiro gesto, os projetos trocam sozinhos (barra de progresso no bloco). Botão "pausar/retomar".
- **prefers-reduced-motion:** sem entrada, sem autoplay, sem inclinação; troca instantânea.

O HTML (`index.html`) é a fonte dos dados: cada `<a class="tile">` traz letra, nome, tipo e `href`; cada `<figure class="pv">` é o painel do mesmo projeto. Para pôr foto real, coloque um `<img>` dentro de `.pv__img` (proporção 5:4).

A versão anterior (pilha de cards com GSAP Flip) está na tag Git `cards-stack-v1`: `git checkout cards-stack-v1`.

## Páginas de projeto (`projetos/<slug>/`)

Cada letra da Home leva a uma página própria, gerada por script (não edite os HTML à mão):

    python tools/build_site.py      # gera projetos/*/index.html e atualiza o bloco "PROJETOS" da Home
    python tools/build_images.py    # otimiza as fotos escolhidas (precisa das fotos originais na máquina)

- **Dados:** `tools/projects_data.py` — letra, nome, tipo, cor do tema, textos (`lead`) e quais fotos usar (`picks`; a 1ª é a capa).
- **Tema por projeto:** cada página usa a cor do bloco-letra (terracota, sálvia, azul ou grafite) e os tons do próprio projeto.
- **Navegação:** botão "← Projetos" (volta à Home já no projeto certo, via `?ativo=slug`), setas anterior/próximo na barra e nas laterais (desktop), bloco "próximo projeto" no fim e link de volta no rodapé.
- **Galeria:** clique abre visualização ampliada (setas, teclado ← → Esc, swipe no toque, contador).
- **Home:** a prévia ao lado do nome usa a capa de cada projeto.
- Os textos `lead` são rascunhos baseados só no que se vê nas imagens: a cliente deve revisar.
- Adicionar/remover projeto: edite `projects_data.py` e rode os dois scripts (o layout da Home foi pensado para 9 letras).

### Testes
Ative "reduzir movimento" no sistema operacional para testar o modo sem animação.
