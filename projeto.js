/* =========================================================================
   Página de PROJETO — comportamento

   1. Barra: ganha fundo sólido depois que a capa passa.
   2. Entrada e parallax da capa; galeria revelada ao rolar (só com movimento permitido).
   3. Lightbox: clique numa imagem abre a visualização ampliada, com
      setas (botões e teclado ← →), swipe no toque, Esc / clique fora para fechar,
      contador, pré-carregamento das vizinhas e foco devolvido ao fechar.
   Sem JS tudo continua funcionando: a galeria é uma lista de botões/imagens
   e as setas entre projetos são links comuns.
   ========================================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Barra ---------- */
  const bar = $('#pjbar');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      bar.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.7);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. Movimento ---------- */
  if (!reduce && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // entrada da capa
    gsap.from('.pjhero__img', { scale: 1.14, duration: 2, ease: 'power3.out' });
    gsap.from(['.pjhero__letter', '.pjhero__eyebrow', '.pjhero h1', '.pjhero__lead'], {
      y: 36, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.2,
    });

    // parallax: a foto sobe mais devagar que a página
    gsap.to('.pjhero__img', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: '.pjhero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // imagens da galeria surgem ao entrar na tela
    gsap.utils.toArray('.pjgal__li').forEach((li) => {
      gsap.from(li, {
        y: 44, autoAlpha: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: li, start: 'top 90%', once: true },
      });
    });
  }

  /* ---------- 3. Lightbox ---------- */
  const dlg = $('#lb');
  const items = [...document.querySelectorAll('.pjgal__item')];
  if (!dlg || !items.length || typeof dlg.showModal !== 'function') return;

  const img = $('.lb__img', dlg), cap = $('.lb__cap', dlg);
  const n = items.length;
  let idx = 0, opener = null;

  const preload = (i) => { const im = new Image(); im.src = items[(i + n) % n].dataset.full; };

  function show(i) {
    idx = (i + n) % n;
    const b = items[idx];
    img.style.opacity = 0;
    img.onload = () => { img.style.opacity = 1; };
    img.src = b.dataset.full;
    img.width = +b.dataset.w; img.height = +b.dataset.h;      // reserva o espaço (evita salto)
    img.alt = b.querySelector('img').alt;
    cap.textContent = `${idx + 1} / ${n}`;
    preload(idx + 1); preload(idx - 1);
  }

  function open(i) {
    opener = items[i];
    show(i);
    dlg.showModal();
    document.documentElement.style.overflow = 'hidden';       // trava o scroll da página por trás
  }

  items.forEach((b, i) => b.addEventListener('click', () => open(i)));
  $('.lb__prev', dlg).addEventListener('click', () => show(idx - 1));
  $('.lb__next', dlg).addEventListener('click', () => show(idx + 1));
  $('.lb__close', dlg).addEventListener('click', () => dlg.close());

  // fechar: clique fora da imagem (o próprio <dialog> é o "fundo"); Esc já é nativo do <dialog>
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('lb__fig')) dlg.close(); });
  dlg.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    if (opener) opener.focus({ preventScroll: true });          // devolve o foco à miniatura de onde veio
  });

  // teclado
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(idx - 1); }
  });

  // swipe (toque/caneta): arrasta na horizontal para trocar
  let sx = null, sy = null;
  dlg.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
  dlg.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = sy = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(idx + (dx < 0 ? 1 : -1));
  });
  dlg.addEventListener('pointercancel', () => { sx = sy = null; });
})();
