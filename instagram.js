/* =========================================================================
   Seção INSTAGRAM — comportamento do carrossel
   • setas: rolam um card por vez (e ficam desabilitadas nas pontas);
   • barra de progresso acompanha a rolagem;
   • mouse: arrastar para rolar (toque já rola nativamente); um arrasto NÃO abre o Reel por engano;
   • entrada: os cards sobem em cascata quando a seção aparece (uma vez).
   O HTML é gerado por tools/build_instagram.py. Sem JS, o trilho continua rolável e os cards são links.
   ========================================================================= */
(() => {
  'use strict';

  const sec = document.getElementById('instagram');
  if (!sec) return;

  const track = document.getElementById('igTrack');
  const prev = document.getElementById('igPrev');
  const next = document.getElementById('igNext');
  const bar = document.getElementById('igBar');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- setas + progresso ---------- */
  const stepPx = () => {
    const items = track.querySelectorAll('.ig__item');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    return (items[0] ? items[0].getBoundingClientRect().width : 300) + gap;
  };

  let ticking = false;
  function update() {
    ticking = false;
    const max = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    prev.disabled = x <= 2;
    next.disabled = x >= max - 2;
    // a barra vai de 25% (início) a 100% (fim)
    bar.style.transform = `scaleX(${max > 0 ? 0.25 + 0.75 * Math.min(1, x / max) : 1})`;
  }
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  prev.addEventListener('click', () => track.scrollBy({ left: -stepPx(), behavior: reduce ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: stepPx(), behavior: reduce ? 'auto' : 'smooth' }));
  track.addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();

  /* ---------- arrastar com o mouse ---------- */
  let drag = null, moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft };
    moved = false;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }   // 5 px: ainda é um clique
    if (moved) track.scrollLeft = drag.left - dx;
  });
  const endDrag = () => { if (!drag) return; drag = null; track.classList.remove('is-dragging'); };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);
  // se arrastou, o clique que vem em seguida não deve abrir o Reel
  track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* ---------- entrada (uma vez) ---------- */
  if (!('IntersectionObserver' in window) || reduce) { sec.classList.add('is-in'); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { sec.classList.add('is-in'); io.disconnect(); }
  }, { threshold: 0.18 });
  io.observe(sec);
  setTimeout(() => sec.classList.add('is-in'), 8000);      // rede de segurança: nunca deixa os cards escondidos
})();
