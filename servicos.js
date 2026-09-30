/* =========================================================================
   Seção SERVIÇOS — comportamento do acordeão

   O HTML já traz todo o conteúdo. Este script só:
     1. abre/fecha os painéis (um por vez) mantendo aria-expanded correto;
     2. permite navegar entre os títulos com ↑ ↓ Home End (padrão WAI-ARIA);
     3. recalcula o ScrollTrigger quando a altura da seção muda (as seções
        seguintes dependem disso);
     4. faz a entrada em cascata das linhas quando a seção aparece.
   A animação de altura em si é CSS puro (grid-template-rows) — ver servicos.css.
   ========================================================================= */
(() => {
  'use strict';

  const list = document.getElementById('svcList');
  if (!list) return;

  const items = [...list.querySelectorAll('.svc')];
  const buttons = items.map((li) => li.querySelector('.svc__btn'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- abrir / fechar ---------- */
  function setOpen(item, open) {
    item.classList.toggle('is-open', open);
    item.querySelector('.svc__btn').setAttribute('aria-expanded', String(open));
  }

  /* Ao abrir um serviço, o que estava aberto acima dele fecha e a página inteira "sobe": o título clicado
     podia sair da tela (bug no celular). Enquanto os painéis animam, mantemos o título no mesmo lugar da tela. */
  let holdRaf = 0;
  function holdPosition(btn, ms) {
    cancelAnimationFrame(holdRaf);
    const startTop = btn.getBoundingClientRect().top;
    const t0 = performance.now();
    const stop = () => cancelAnimationFrame(holdRaf);
    // se a pessoa rolar com o dedo/roda durante a animação, para de corrigir (ela manda)
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, stop, { once: true, passive: true }));
    const step = () => {
      const dy = btn.getBoundingClientRect().top - startTop;
      if (Math.abs(dy) > 0.5) window.scrollBy(0, dy);
      if (performance.now() - t0 < ms) holdRaf = requestAnimationFrame(step);
    };
    holdRaf = requestAnimationFrame(step);
  }

  function toggle(item) {
    const willOpen = !item.classList.contains('is-open');
    const btn = item.querySelector('.svc__btn');
    if (!reduce) holdPosition(btn, 800);                       // 800 ms > duração da animação de altura (600 ms)
    // um aberto por vez: fecha todos os outros
    items.forEach((other) => { if (other !== item) setOpen(other, false); });
    setOpen(item, willOpen);
  }

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => toggle(items[i]));

    // navegação por teclado entre os títulos
    btn.addEventListener('keydown', (e) => {
      const last = buttons.length - 1;
      const target = { ArrowDown: Math.min(i + 1, last), ArrowUp: Math.max(i - 1, 0), Home: 0, End: last }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      buttons[target].focus();
    });
  });

  /* ---------- a altura da seção mudou: atualiza os gatilhos de scroll ---------- */
  let refreshTimer;
  list.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'grid-template-rows') return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 60);
  });

  /* ---------- entrada em cascata (só com movimento permitido) ---------- */
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const intro = document.querySelector('.services__intro');
  gsap.from(intro.children, {
    y: 28, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: intro, start: 'top 80%', once: true },
  });
  gsap.from(items, {
    y: 36, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09,
    scrollTrigger: { trigger: list, start: 'top 82%', once: true },
  });
})();
