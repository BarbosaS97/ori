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
- `assets/sobre-nos*.webp` — foto do Sobre (gerada por `tools/build_about.py`)
- `assets/simbolo-ori.svg` — símbolo das 5 folhas (vetorizado do manual; inline no `index.html` como `<symbol id="simbolo">`)
- `assets/frames-d`, `assets/frames-m` — sequência de 201 frames (desktop / mobile vertical)
- `assets/hero-socias.*` — foto das sócias
- `tools/build_assets.py` — gera os frames a partir do vídeo (caminhos locais, não roda fora da máquina de origem)

Protótipo interno: `noindex` ativo. Vídeo gerado por IA (GPT + Google Flow), ilustração conceitual.

## Seção de projetos (`projetos.js` + `projetos.css`)

O nome **STUDIO ÓRI** já aparece formado: 9 blocos coloridos, cada um é um projeto (S T U D I O Ó R I; o "O" de STUDIO é o símbolo das folhas).

- **Desktop:** passar o mouse (ou focar com o teclado) ativa o projeto: o bloco sobe e o painel à direita troca a imagem com uma cortina. Clicar no bloco ou no painel abre o projeto. O bloco sob o cursor inclina em 3D.
- **Toque:** o 1º toque seleciona, o 2º abre. No celular há **setas laterais** na prévia (anterior/próximo, dando a volta) e swipe horizontal, que mudam a letra ativa.
- **Carregamento da prévia:** cada painel mostra a logo + barra (como o loader do site) até a foto chegar. As capas só começam a baixar perto da seção ou ao avançar até elas (`loadPv` em `projetos.js`), para não competir com o hero.
- **Entrada das letras:** roda do zero **a cada vez** que a seção fica visível e volta ao estado inicial quando ela sai da tela (`IntersectionObserver` em `projetos.js`, sem depender de posição de scroll). Só começa depois que o hero criou o espaço do scroll.
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

## Desempenho e verificações

- **Hero (frames):** cada frame é baixado como Blob e decodificado com `createImageBitmap`, fora da thread principal (o trace do navegador mostrou ~7 ms de decodificação por troca de frame na thread principal, que travava o scroll). O canvas usa a resolução nativa dos frames. O loader sai assim que a foto do hero chega; os 201 frames baixam em seguida (1 a cada 4 com "economia de dados"). Frames verticais só em tela estreita em pé; celular deitado e tablet usam os horizontais.
- **Menu do celular:** `nav.js` (botão hambúrguer + painel), abaixo de 860 px.
- **Acessibilidade:** auditado com axe-core (WCAG 2.2 AA + boas práticas) na Home e nas páginas de projeto, sem violações. Contraste de texto pequeno corrigido.
- **Checagem estática:** `python tools/audit_static.py` confere links, recursos (com diferenciação de maiúsculas, como no GitHub Pages), ids duplicados, `alt`, dimensões de imagem e hierarquia de títulos. Confere também que não sobrou `#contato` e que todo link de WhatsApp é o de `tools/site_config.py`. Os únicos avisos são os links ainda sem página (`#servico-*`, `#projetos-todos`).

## Página de links (`/links/`)

Página "link na bio" exclusiva do Studio Óri, no lugar do Linktree (`linktr.ee/ori.arqui`). Fora do menu do site: o endereço é `…/links/`.
Foto em arco das arquitetas, logotipo, slogan e 5 botões (Site & Portfólio, Orçamentos, WhatsApp em destaque, Instagram, Facebook), com animação de entrada e preenchimento no hover/toque. Sem JavaScript.

    python tools/build_links.py     # edite LINKS no script para trocar, reordenar ou adicionar links

Está com `noindex` (como o resto do protótipo). Sem estatísticas de clique (o Linktree tinha): se precisar, dá para adicionar analytics depois.

## Seção "Siga o @ori.arqui" (Instagram)

Carrossel de Reels em cards no estilo Instagram (avatar com o símbolo, nome, ícones), sobre o azul-marinho da marca. Rolagem horizontal por toque, arrastar com o mouse e setas; cada card abre o Reel no Instagram (nova aba).
A seção é compacta: o tamanho dos cards (`--cw` em `instagram.css`) depende da largura e da altura da tela para ela caber inteira; no computador os 5 cards aparecem juntos (sem setas), no celular deslizam. Sem API: as capas são arquivos locais. Coloque `reel-01.jpg` … `reel-05.jpg` em `../_material-original/instagram/` (fora do site; ver o LEIAME.txt de lá) e rode `python tools/build_site.py`. Links e ordem dos Reels: lista `REELS` em `tools/build_instagram.py`.

### Testes
Ative "reduzir movimento" no sistema operacional para testar o modo sem animação.

## Conversão (WhatsApp) e contato

- **"Contato" do menu** (desktop e celular) leva à página de links (`links/`).
- **Todos os botões de conversão** ("Quero transformar o meu espaço", "Fale conosco": topo, fim do hero, seção Projetos e rodapé de cada página de projeto) abrem o **WhatsApp** em nova aba, com o mesmo link do Linktree delas.
- O link fica em `tools/site_config.py` (`WHATSAPP_URL`). Para mudar (ou pôr uma mensagem inicial), edite lá e rode `python tools/build_site.py && python tools/build_links.py`; no `index.html` (menu, topo, hero) a troca é manual e o `audit_static.py` avisa se ficar diferente.
