/* FECHAMENTO — entrada discreta: a faixa aparece com um leve "sobe e surge" quando entra na tela (uma vez).
   Sem JS ou com prefers-reduced-motion o conteúdo já aparece inteiro. */
(() => {
  'use strict';
  const el = document.getElementById('fechamento');
  if (!el) return;
  const show = () => el.classList.add('is-in');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { show(); return; }
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { show(); io.disconnect(); }
  }, { threshold: 0.2 });
  io.observe(el);
  setTimeout(show, 8000);          // rede de segurança: nunca deixa a faixa escondida
})();
