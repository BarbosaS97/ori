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
- `assets/frames-d`, `assets/frames-m` — sequência de 201 frames (desktop / mobile vertical)
- `assets/hero-socias.*` — foto das sócias
- `tools/build_assets.py` — gera os frames a partir do vídeo (caminhos locais, não roda fora da máquina de origem)

Protótipo interno: `noindex` ativo. Vídeo gerado por IA (GPT + Google Flow), ilustração conceitual.
