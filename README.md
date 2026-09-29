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
- `cards.css`, `cards.js` — seção de projetos (pilha de cards → "STUDIO ÓRI")
- `assets/simbolo-ori.svg` — símbolo das 5 folhas (vetorizado do manual; inline no `index.html` como `<symbol id="simbolo">`)
- `assets/frames-d`, `assets/frames-m` — sequência de 201 frames (desktop / mobile vertical)
- `assets/hero-socias.*` — foto das sócias
- `tools/build_assets.py` — gera os frames a partir do vídeo (caminhos locais, não roda fora da máquina de origem)

Protótipo interno: `noindex` ativo. Vídeo gerado por IA (GPT + Google Flow), ilustração conceitual.

## Seção de projetos (`cards.js`)

Pilha de 9 cards; cada clique em "Próximo" (ou toque/swipe na pilha) faz o card do topo voar até o slot da sua letra.
Ordem das letras: S T U D I O Ó R I (o "O" de STUDIO é o símbolo das folhas).

### Como o GSAP Flip funciona aqui
Flip anima entre dois **estados de layout** sem você calcular coordenadas. Receita usada em `advance()`:

1. **First** — `Flip.getState(card)` grava posição e tamanho do card na pilha.
2. **Last** — `slot.appendChild(card)` move o card no DOM para dentro do slot; o CSS o faz preencher o slot.
3. **Invert + Play** — `Flip.from(state, { scale: true })` aplica um transform que faz o card *parecer* ainda estar na pilha e o anima até o slot.

`scale: true` anima por `scaleX/scaleY` (barato, sem reflow). Só fica sem distorção porque pilha e slot têm a mesma proporção 4:5 e todo o conteúdo do card é medido em `cqw`.

Em paralelo, dois tweens normais completam o efeito:
- `rotationY 0→180` em `.card__inner` (frente = foto, verso = letra, `backface-visibility: hidden`);
- sobe/desce (`yPercent`) em `.card__lift` — o arco do voo.

No final, `finish()` usa Flip de novo: grava os 9 cards, adiciona `.is-done` (o CSS remove a pilha e centraliza a palavra) e anima cada card até a nova posição.
ScrollTrigger só dispara a entrada da pilha; a interação em si é por clique.

### Trocar os placeholders por fotos
Em `cards.js`, no array `PROJECTS`, preencha `img: 'assets/projetos/xxx.webp'` (proporção ideal 4:5).

### Testes
`?dev` no endereço mostra um botão "reiniciar". `prefers-reduced-motion` mostra os 9 cards num grid estático.
