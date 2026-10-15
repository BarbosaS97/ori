/* Seção PROJETOS — galeria editorial (computador) e faixa de capas (celular).
   Trilho com scroll-snap nativo (deslizar no toque, trackpad, setas, números e teclado ← →). */
(() => {
  'use strict';
  const variant = document.documentElement.dataset.projetos;

  /* ----- variante 4: faixa de capas altas (rolagem horizontal) ----- */
  if (variant === '4') {
    const tr = document.getElementById('v4Track');
    if (!tr) return;
    const pv = document.getElementById('v4Prev'), nx = document.getElementById('v4Next');
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stepPx = () => { const c = tr.children[0]; return (c ? c.getBoundingClientRect().width : 280) + (parseFloat(getComputedStyle(tr).columnGap) || 16); };
    const upd = () => {
      const max = tr.scrollWidth - tr.clientWidth, x = tr.scrollLeft;
      pv.disabled = x <= 2; nx.disabled = x >= max - 2;
    };
    let t = false;
    tr.addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(() => { t = false; upd(); }); } }, { passive: true });
    addEventListener('resize', upd);
    pv.addEventListener('click', () => tr.scrollBy({ left: -stepPx() * (innerWidth > 860 ? 4 : 1), behavior: rm ? 'auto' : 'smooth' }));
    nx.addEventListener('click', () => tr.scrollBy({ left: stepPx() * (innerWidth > 860 ? 4 : 1), behavior: rm ? 'auto' : 'smooth' }));
    tr.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); tr.scrollBy({ left: stepPx(), behavior: rm ? 'auto' : 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); tr.scrollBy({ left: -stepPx(), behavior: rm ? 'auto' : 'smooth' }); }
    });
    upd();
    return;
  }

  if (variant !== '2') return;

  const track = document.getElementById('v2Track');
  if (!track) return;
  const slides = [...track.children];
  const nums = [...document.querySelectorAll('.v2__n')];
  const prev = document.getElementById('v2Prev');
  const next = document.getElementById('v2Next');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = 0;

  const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
  const go = (i) => {
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
  };

  function sync() {
    const max = track.scrollWidth - track.clientWidth;
    let i = Math.round(track.scrollLeft / step());
    if (max > 0 && track.scrollLeft >= max - 2) i = slides.length - 1;
    i = Math.max(0, Math.min(slides.length - 1, i));
    cur = i;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    nums.forEach((n, k) => { n.classList.toggle('is-active', k === i); n.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
  }

  let tick = false;
  track.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; sync(); }); } }, { passive: true });
  addEventListener('resize', sync);
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  nums.forEach((n) => n.addEventListener('click', () => go(+n.dataset.i)));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
  sync();
})();
