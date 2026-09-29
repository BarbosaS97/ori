/* =========================================================================
   Seção PROJETOS — "STUDIO ÓRI" formado; cada letra é um projeto

   Como funciona:
   • Cada bloco (.tile) é um LINK para o projeto. Passar o mouse, focar com o teclado
     ou tocar (1º toque) ATIVA o projeto: o bloco sobe e o painel ao lado troca a imagem
     com uma cortina (clip-path). Clicar num bloco já ativo — ou no painel — abre o projeto.
   • Entrada: ao rolar até a seção, os blocos "viram" em cascata (rotationY).
   • Autoplay: até o primeiro gesto do usuário, o projeto ativo troca sozinho a cada ~4,6 s,
     com uma barrinha de progresso no bloco. Há botão "pausar" (acessibilidade).
   • Desktop com mouse: o bloco sob o cursor se inclina em 3D e ganha um brilho.
   • prefers-reduced-motion: sem entrada, sem autoplay, sem inclinação; troca instantânea.

   O HTML é a fonte dos dados (letra, nome, tipo, href). Aqui só há comportamento.
   ========================================================================= */
(() => {
  'use strict';

  const section = document.getElementById('projetos');
  if (!section) return;

  const tiles = [...section.querySelectorAll('.tile')];
  const pvs = [...section.querySelectorAll('.pv')];
  const N = tiles.length;
  const hint = document.getElementById('lettersHint');
  const countEl = document.getElementById('pvCount');
  const autoBtn = document.getElementById('autoBtn');
  const nav = document.getElementById('nav');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;
  const AUTO_MS = 4.6;                      // tempo de cada projeto no autoplay (s)

  if (!canHover) hint.textContent = 'Toque em uma letra para ver o projeto; toque de novo para abrir.';

  /* ---------- menu ganha fundo sólido quando a seção alcança o topo ---------- */
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: section, start: 'top top+=70',
      onEnter: () => nav.classList.add('is-solid'),
      onLeaveBack: () => nav.classList.remove('is-solid'),
    });
  }

  /* ---------- estado ---------- */
  let cur = 0;                              // índice do projeto ativo
  let autoOn = !reduce;                     // autoplay ligado?
  let inView = false;
  let barTween = null;

  // Voltando de uma página de projeto (?ativo=slug): abre o painel nesse projeto, sem autoplay
  const wanted = new URLSearchParams(location.search).get('ativo');
  const wantedIdx = tiles.findIndex((t) => t.dataset.slug === wanted);
  if (wantedIdx >= 0) {
    cur = wantedIdx; autoOn = false;
    tiles.forEach((t, k) => {
      t.classList.toggle('is-active', k === cur);
      k === cur ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current');
    });
    pvs.forEach((p, k) => p.classList.toggle('is-active', k === cur));
    countEl.textContent = String(cur + 1).padStart(2, '0');
  }

  /* ---------- ATIVAR um projeto ---------- */
  function activate(i, { auto = false } = {}) {
    if (!auto && autoOn) stopAuto();        // qualquer gesto do usuário para o autoplay
    if (i === cur) return;

    const prev = pvs[cur], next = pvs[i];
    const dir = i > cur ? 1 : -1;           // a cortina entra pelo lado do sentido da troca
    cur = i;

    tiles.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-active', on);
      on ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current');
    });
    countEl.textContent = String(i + 1).padStart(2, '0');

    if (reduce || !window.gsap) {           // troca instantânea
      pvs.forEach((p) => p.classList.toggle('is-active', p === next));
      return;
    }

    // Só o anterior e o novo ficam visíveis durante a transição
    pvs.forEach((p) => { if (p !== prev && p !== next) { gsap.killTweensOf(p); p.classList.remove('is-active'); gsap.set(p, { clearProps: 'clipPath' }); } });
    gsap.killTweensOf([prev, next, next.querySelector('.pv__img'), ...next.querySelectorAll('.pv__cap > *')]);

    prev.classList.add('is-active'); prev.style.zIndex = 1;
    next.classList.add('is-active'); next.style.zIndex = 2;

    // cortina: o novo projeto "abre" por cima do anterior; a imagem dá um leve zoom-out
    gsap.fromTo(next,
      { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0 0 0)', duration: 0.85, ease: 'power3.inOut',
        onComplete: () => { prev.classList.remove('is-active'); prev.style.zIndex = ''; next.style.zIndex = ''; gsap.set(next, { clearProps: 'clipPath' }); } });
    gsap.fromTo(next.querySelector('.pv__img'), { scale: 1.16 }, { scale: 1, duration: 1.3, ease: 'power3.out' });
    gsap.fromTo(next.querySelectorAll('.pv__cap > *'), { y: 18, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out', stagger: 0.06, delay: 0.3 });

    if (auto || autoOn) startAuto();
  }

  /* ---------- AUTOPLAY ---------- */
  function startAuto() {
    killBar();
    if (!autoOn || !inView || document.hidden || reduce) return;
    const bar = tiles[cur].querySelector('.tile__bar i');
    barTween = gsap.fromTo(bar, { scaleX: 0 }, {
      scaleX: 1, duration: AUTO_MS, ease: 'none',
      onComplete: () => activate((cur + 1) % N, { auto: true }),
    });
  }
  function killBar() { if (barTween) { barTween.kill(); barTween = null; } tiles.forEach((t) => gsap.set(t.querySelector('.tile__bar i'), { scaleX: 0 })); }
  function stopAuto() { autoOn = false; killBar(); setBtn(); }
  function setBtn() {
    autoBtn.textContent = autoOn ? 'pausar' : 'retomar';
    autoBtn.setAttribute('aria-pressed', String(!autoOn));
  }
  autoBtn.addEventListener('click', () => {
    autoOn = !autoOn;
    autoOn ? startAuto() : killBar();
    setBtn();
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? killBar() : startAuto()));

  /* ---------- Eventos dos blocos ---------- */
  tiles.forEach((tile, i) => {
    tile.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') activate(i); });
    // Foco por TECLADO ativa o projeto. (No toque o foco não é "visible", então não interfere no 1º toque.)
    tile.addEventListener('focus', () => { if (tile.matches(':focus-visible')) activate(i); });
    tile.addEventListener('click', (e) => {
      // Toque/caneta: o 1º toque só seleciona; o 2º (bloco já ativo) abre o projeto.
      // Mouse já ativou no hover; teclado (Enter) tem pointerType vazio — ambos seguem o link.
      if (e.pointerType && e.pointerType !== 'mouse' && cur !== i) { e.preventDefault(); activate(i); }
    });

    // Inclinação 3D com o cursor (só com mouse e movimento permitido)
    if (canHover && !reduce && window.gsap) {
      const face = tile.querySelector('.tile__face');
      tile.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = tile.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        face.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        face.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        gsap.to(face, { rotationY: x * 16, rotationX: -y * 16, transformPerspective: 700, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      });
      tile.addEventListener('pointerleave', () => gsap.to(face, { rotationY: 0, rotationX: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
    }
  });

  /* ---------- Entrada + estado de visibilidade ---------- */
  if (reduce || !window.gsap || !window.ScrollTrigger) { setBtn(); return; }

  // blocos e painel começam escondidos; a entrada roda uma vez quando a seção aparece
  const faces = tiles.map((t) => t.querySelector('.tile__face'));
  gsap.set(faces, { autoAlpha: 0 });
  gsap.set('#pvFrame', { autoAlpha: 0 });

  function enter() {
    gsap.fromTo(faces,
      { rotationY: -90, y: 46, autoAlpha: 0, transformPerspective: 700 },
      { rotationY: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.5)', stagger: 0.07 });
    gsap.fromTo('#pvFrame', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.5 });
    gsap.fromTo(pvs[cur].querySelector('.pv__img'), { scale: 1.16 }, { scale: 1, duration: 1.5, ease: 'power3.out', delay: 0.5 });
    // as capas dos outros projetos passam a carregar já (evita "pop-in" ao passar o mouse)
    section.querySelectorAll('.pv__img img').forEach((im) => { im.loading = 'eager'; });
    gsap.delayedCall(1.4, startAuto);
  }

  let entered = false;
  ScrollTrigger.create({
    trigger: section, start: 'top 65%', end: 'bottom 15%',
    onEnter: () => { if (!entered) { entered = true; enter(); } },
    onToggle: (self) => { inView = self.isActive; if (entered) (inView ? startAuto() : killBar()); },
  });
  if (section.getBoundingClientRect().top < innerHeight * 0.65) { inView = true; entered = true; enter(); }   // link direto #projetos

  setBtn();
})();
