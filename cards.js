/* =========================================================================
   Seção PROJETOS — a pilha de cards que forma "STUDIO ÓRI"

   Como funciona (resumo; a explicação completa está no README):

   1. Cada projeto é um <article.card> com duas faces: frente (foto) e verso (letra).
   2. Os cards começam empilhados no .deck. A cada clique, o card do topo é
      REPARENTADO (movido no DOM) para o slot da sua letra, dentro de .word.
   3. O GSAP Flip cuida do "voo": grava posição/tamanho ANTES de mover o card
      (getState), move no DOM, e anima do estado antigo para o novo (Flip.from).
      Como pilha e slot têm a mesma proporção (4:5), o Flip usa scale:true e
      só escala o card — sem distorcer nada.
   4. Em paralelo, o .card__inner gira 180° (rotationY) e o .card__lift faz o
      arco (sobe e desce), então o voo é: Flip (A→B) + giro + arco.
   5. Quando as 9 letras pousam, um segundo Flip recentraliza a palavra e o CTA aparece.

   ScrollTrigger só dispara a entrada da pilha quando a seção aparece.
   ========================================================================= */
(() => {
  'use strict';

  const section = document.getElementById('projetos');
  if (!section) return;

  /* ----------------------------------------------------------------------
     DADOS — para trocar o placeholder por foto real, preencha `img`
     (ex.: 'assets/projetos/casa-aconchego.webp'). `tone` são as duas cores
     do degradê usado enquanto não há foto.
     A ordem define a letra: S T U D I O Ó R I. Os 3 favoritos vêm primeiro.
     ---------------------------------------------------------------------- */
  const PROJECTS = [
    { letter: 'S', name: 'Casa Aconchego',       type: 'residencial', tone: ['#C9A98A', '#8A5A3A'], href: '#projeto-casa-aconchego',  img: null },
    { letter: 'T', name: 'Apartamento Mar',      type: 'residencial', tone: ['#B9C4C0', '#6F8480'], href: '#projeto-apartamento-mar', img: null },
    { letter: 'U', name: 'Rancho OC',            type: 'residencial', tone: ['#B8B29A', '#6E6A4F'], href: '#projeto-rancho-oc',       img: null },
    { letter: 'D', name: 'Projeto R&R',          type: 'residencial', tone: ['#D8C9B8', '#A98B72'], href: '#projeto-rr',              img: null },
    { letter: 'I', name: 'Projeto JO',           type: 'residencial', tone: ['#A9B39A', '#6F7B5E'], href: '#projeto-jo',              img: null },
    { letter: 'O', name: 'Apartamento Oliva',    type: 'residencial', tone: ['#C7B7A3', '#8B7B6A'], href: '#projeto-oliva',           img: null, symbol: true },
    { letter: 'Ó', name: 'Ólie Beauty Clinic',   type: 'comercial',   tone: ['#E2CFC1', '#BC9E8D'], href: '#projeto-olie',            img: null },
    { letter: 'R', name: 'Guarita Victória',     type: 'institucional', tone: ['#7F8794', '#3F4652'], href: '#projeto-guarita-victoria', img: null },
    { letter: 'I', name: 'Quarto Âmbar',         type: 'residencial', tone: ['#C9905F', '#8E4F22'], href: '#projeto-quarto-ambar',    img: null },
  ];
  // cor do verso de cada card (paleta do manual de marca)
  const TILES = ['terracota', 'salvia', 'azul', 'grafite', 'terracota', 'salvia', 'azul', 'terracota', 'grafite'];
  const N = PROJECTS.length;
  const ROWS = [[0, 6], [6, 9]];           // STUDIO / ÓRI

  const $ = (id) => document.getElementById(id);
  const deck = $('deck'), word = $('word'), nextBtn = $('next'), countEl = $('count');
  const controls = $('controls'), cta = $('cta'), live = $('live'), hint = $('lettersHint'), staticList = $('static');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mqMobile = matchMedia('(max-width: 860px), (max-aspect-ratio: 4/5)');
  const isMobile = () => mqMobile.matches;

  /* ----------------------------------------------------------------------
     Markup dos cards
     ---------------------------------------------------------------------- */
  const pad = (n) => String(n).padStart(2, '0');
  const symbolSVG = '<svg class="glyph glyph--sym" viewBox="0 0 1996 1969" aria-hidden="true"><use href="#simbolo"/></svg>';

  const frontHTML = (p, i) => `
    <div class="face face--front" style="--c1:${p.tone[0]};--c2:${p.tone[1]}">
      ${p.img ? `<img src="${p.img}" alt="" loading="lazy" decoding="async">` : ''}
      <span class="ph__num">${pad(i + 1)}</span>
      <span class="ph__meta"><small>${p.type}</small><strong>${p.name}</strong></span>
    </div>`;

  const backHTML = (p, i) => `
    <div class="face face--back" data-tile="${TILES[i]}">
      ${p.symbol ? symbolSVG : `<span class="glyph">${p.letter}</span>`}
    </div>`;

  /* ----------------------------------------------------------------------
     Modo estático (prefers-reduced-motion): grid de 9 cards + CTA, sem animação
     ---------------------------------------------------------------------- */
  if (reduce) {
    section.classList.add('is-static');
    staticList.hidden = false;
    staticList.innerHTML = PROJECTS.map((p, i) => `
      <li class="sg">
        <article class="card">
          ${frontHTML(p, i)}
          <span class="sg__chip" aria-label="Letra ${p.letter}">${p.symbol ? '<svg viewBox="0 0 1996 1969" aria-hidden="true"><use href="#simbolo"/></svg>' : p.letter}</span>
        </article>
        <a class="sg__link" href="${p.href}">${p.name} · ver projeto</a>
      </li>`).join('');
    return;                                   // nada de GSAP aqui
  }

  gsap.registerPlugin(ScrollTrigger, Flip);

  /* ----------------------------------------------------------------------
     Construção do DOM: cards na pilha, slots na palavra
     ---------------------------------------------------------------------- */
  const cards = PROJECTS.map((p, i) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.i = i;
    el.innerHTML = `<div class="card__lift"><div class="card__inner">${frontHTML(p, i)}${backHTML(p, i)}</div></div>`;
    deck.appendChild(el);
    return el;
  });

  const slots = [];
  ROWS.forEach(([from, to]) => {
    const row = document.createElement('div');
    row.className = 'word__row';
    for (let i = from; i < to; i++) {
      const p = PROJECTS[i];
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.innerHTML = `
        <span class="slot__ghost" aria-hidden="true">${p.symbol ? symbolSVG : p.letter}</span>
        <a class="slot__cap" href="${p.href}" aria-label="Letra ${p.letter}: ${p.name}, projeto ${p.type}">
          <small>${p.type}</small>${p.name}
        </a>`;
      row.appendChild(slot);
      slots[i] = slot;
    }
    word.appendChild(row);
  });

  /* ----------------------------------------------------------------------
     Estado
     ---------------------------------------------------------------------- */
  let remaining = cards.slice();   // remaining[0] = card do topo (o próximo a voar)
  let ready = false;               // a entrada (intro) já rodou?
  let busy = false;                // um voo em andamento bloqueia novos cliques por um instante
  let queued = false;              // ...mas 1 clique feito durante o voo é executado assim que liberar
  let landed = 0;                  // quantos já pousaram
  let done = false;
  let inView = false;
  let interacted = false;

  /* ----------------------------------------------------------------------
     PILHA — posiciona cada card restante conforme a profundidade.
       desktop: cards por baixo deslocados p/ a esquerda (mostra as bordas)
       mobile : só o card do topo aparece; os outros esperam invisíveis
     mode: 'set' (imediato) | 'tween' (animado) | 'intro' (entrada)
     ---------------------------------------------------------------------- */
  function layoutStack(mode = 'tween') {
    const step = isMobile() ? 0 : (parseFloat(getComputedStyle(deck).getPropertyValue('--step')) || 14);
    remaining.forEach((card, depth) => {
      const target = isMobile()
        ? { x: 0, y: 0, scale: depth === 0 ? 1 : 0.94, autoAlpha: depth === 0 ? 1 : 0 }
        : { x: -depth * step, y: 0, scale: 1, autoAlpha: 1 };
      gsap.set(card, { zIndex: N - depth });

      if (mode === 'set') {
        gsap.set(card, target);
      } else if (mode === 'intro') {
        // entra deslizando da direita, do fundo da pilha para o topo
        gsap.fromTo(card,
          { x: target.x + 70, y: 0, scale: target.scale, autoAlpha: 0 },
          { ...target, duration: 0.9, ease: 'power3.out', delay: (remaining.length - 1 - depth) * 0.06 });
      } else {
        gsap.to(card, { ...target, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
      }
    });
  }

  /* ----------------------------------------------------------------------
     AVANÇAR — o coração da animação: o card do topo voa até a sua letra
     ---------------------------------------------------------------------- */
  function advance() {
    if (!ready || done || !remaining.length) return;
    if (busy) { queued = true; return; }             // clique durante o voo: guarda 1 na fila (não acumula mais que isso)
    busy = true;
    interacted = true;
    gsap.to(hint, { autoAlpha: 0, duration: 0.3 });

    const card = remaining.shift();                 // sai da pilha
    const i = +card.dataset.i;                      // índice = posição da letra
    const slot = slots[i];
    const lift = card.querySelector('.card__lift');
    const inner = card.querySelector('.card__inner');

    gsap.killTweensOf(card);                        // cancela a "cutucada" de dica, se houver
    gsap.set(card, { x: 0, y: 0, scale: 1, autoAlpha: 1, zIndex: 100 });
    card.classList.add('is-flying');

    const D = isMobile() ? 1.05 : 1.15;             // duração do voo (s)
    const tileW = slot.getBoundingClientRect().width;

    // ---- FLIP, passo 1: FIRST — grava onde o card está agora (na pilha) ----
    const state = Flip.getState(card);

    // ---- FLIP, passo 2: LAST — muda o DOM. O card passa a viver dentro do slot.
    // O CSS (.slot .card) faz ele preencher o slot; visualmente ele "teleportaria".
    slot.appendChild(card);

    // Reorganiza o resto da pilha em paralelo (desktop: fecha o vão; mobile: revela o próximo)
    layoutStack('tween');

    // ---- FLIP, passos 3 e 4: INVERT + PLAY — o Flip aplica um transform que faz o
    // card parecer ainda estar na pilha e o anima até a posição/tamanho do slot.
    Flip.from(state, {
      duration: D,
      ease: 'power3.inOut',
      scale: true,                                  // anima por scaleX/scaleY (não width/height): leve e sem distorção
      onComplete: () => {
        card.classList.remove('is-flying');
        gsap.set(card, { clearProps: 'zIndex' });
        slot.classList.add('is-filled');
        gsap.to(slot.querySelector('.slot__cap'), { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
        gsap.set(slot.querySelector('.slot__ghost'), { autoAlpha: 0 });
        landed++;
        if (landed === N) finish();
      },
    });

    // ---- Giro: a frente some em 90° e a letra (verso) aparece em 180° ----
    // transformPerspective proporcional ao tamanho do tile: o efeito 3D fica igual em qualquer tela.
    gsap.fromTo(inner,
      { rotationY: 0 },
      { rotationY: 180, transformPerspective: tileW * 5, duration: D * 0.85, delay: D * 0.08, ease: 'power2.inOut' });

    // ---- Arco: o card sobe e cai (yPercent é relativo ao tamanho do card) e inclina de leve ----
    gsap.timeline()
      .to(lift, { yPercent: -34, rotation: -5, duration: D * 0.5, ease: 'power2.out' })
      .to(lift, { yPercent: 0, rotation: 0, duration: D * 0.5, ease: 'power2.in' });

    // libera o próximo clique antes do fim do pouso (dá sensação de resposta imediata)
    gsap.delayedCall(D * 0.75, () => {
      busy = false;
      if (queued) { queued = false; advance(); }
    });

    // contador e anúncio para leitor de tela
    countEl.textContent = String(i + 1);
    live.textContent = `Letra ${PROJECTS[i].letter}: ${PROJECTS[i].name}, projeto ${PROJECTS[i].type}.`;
  }

  /* ----------------------------------------------------------------------
     FINAL — as 9 letras estão no lugar. Um segundo Flip recentraliza a palavra.
     ---------------------------------------------------------------------- */
  function finish() {
    done = true;
    live.textContent = 'STUDIO ÓRI completo. Conheça todos os projetos ou fale com a gente.';
    gsap.to(controls, { autoAlpha: 0, duration: 0.3 });

    const caps = slots.map((s) => s.querySelector('.slot__cap'));
    gsap.set(caps, { autoAlpha: 0 });                       // legendas somem durante o reposicionamento

    // Flip nos 9 cards: grava → muda a classe (o CSS remove a pilha e alarga a palavra) → anima
    const state = Flip.getState(cards);
    section.classList.add('is-done');

    Flip.from(state, {
      duration: 1.1,
      ease: 'power3.inOut',
      scale: true,
      stagger: 0.03,
      onComplete: () => {
        gsap.to(caps, { autoAlpha: 1, duration: 0.6, stagger: 0.04 });
        cta.classList.add('is-live');
        gsap.fromTo(cta, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 });
        ScrollTrigger.refresh();                            // a altura da seção mudou
        cta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });   // garante o CTA visível, sem rolar se já couber
      },
    });
  }

  /* ----------------------------------------------------------------------
     Entrada: quando a seção aparece, a pilha desliza para dentro (uma vez)
     ---------------------------------------------------------------------- */
  function intro() {
    if (ready) return;
    layoutStack('intro');
    gsap.delayedCall(1.1, () => { ready = true; scheduleNudge(); });
  }

  // "clique" no desktop, "toque" em telas sem hover
  if (matchMedia('(hover: hover)').matches) hint.textContent = 'Clique para descobrir, um projeto por vez.';

  layoutStack('set');
  gsap.set(cards, { autoAlpha: 0 });               // invisíveis até a entrada
  gsap.set(cta, { autoAlpha: 0 });

  ScrollTrigger.create({
    trigger: section,
    start: 'top 65%', end: 'bottom 20%',
    onEnter: intro,
    onToggle: (self) => { inView = self.isActive; },
  });
  // menu ganha fundo sólido quando a seção passa por baixo dele (evita texto sobreposto)
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    trigger: section, start: 'top top+=70',
    onEnter: () => nav.classList.add('is-solid'),          // seção alcançou o menu
    onLeaveBack: () => nav.classList.remove('is-solid'),   // voltou para o hero
  });

  // se a seção já estiver visível ao carregar (ex.: link direto #projetos)
  if (section.getBoundingClientRect().top < innerHeight * 0.65) { inView = true; intro(); }

  /* ----------------------------------------------------------------------
     Dica visual: o card do topo "cutuca" para a direita de tempos em tempos,
     até o primeiro clique. Só roda com a seção visível.
     ---------------------------------------------------------------------- */
  function scheduleNudge() {
    if (interacted || done) return;
    gsap.delayedCall(3.6, () => {
      if (interacted || done) return;
      if (inView && !busy && remaining[0]) {
        gsap.to(remaining[0], { x: 14, duration: 0.32, ease: 'power2.out', yoyo: true, repeat: 1 });
      }
      scheduleNudge();
    });
  }

  /* ----------------------------------------------------------------------
     Entradas do usuário: botão, toque/clique na pilha e swipe horizontal
     ---------------------------------------------------------------------- */
  nextBtn.addEventListener('click', advance);

  let down = null;
  deck.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  deck.addEventListener('pointercancel', () => { down = null; });   // o navegador assumiu o gesto (scroll)
  deck.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    const tap = Math.hypot(dx, dy) < 10;
    const swipe = Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy);
    if (tap || swipe) advance();
  });

  // trocou de breakpoint (girar o aparelho, redimensionar): reposiciona a pilha
  mqMobile.addEventListener('change', () => { if (!done) layoutStack('set'); });

  /* Só para testes: ?dev mostra um botão que recarrega a seção */
  if (new URLSearchParams(location.search).has('dev')) {
    const b = document.createElement('button');
    b.textContent = 'reiniciar'; b.type = 'button';
    b.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:200;padding:8px 14px;border-radius:999px;border:1px solid #974315;background:#F3EFEC;color:#974315;font:12px Jost,sans-serif';
    b.onclick = () => { location.hash = '#projetos'; location.reload(); };
    document.body.appendChild(b);
  }
})();
