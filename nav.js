/* =========================================================================
   Menu do celular (Home)
   Botão hambúrguer abre um painel em tela cheia com os mesmos links do menu.
   • aria-expanded / aria-label acompanham o estado;
   • Esc fecha e devolve o foco ao botão; clicar num link fecha e segue a âncora;
   • trava o scroll da página enquanto aberto; fecha sozinho se a tela voltar a ser larga.
   ========================================================================= */
(() => {
  'use strict';

  const btn = document.getElementById('navBurger');
  const panel = document.getElementById('navPanel');
  if (!btn || !panel) return;

  const mqNarrow = matchMedia('(max-width: 860px)');
  const root = document.documentElement;

  function setOpen(open, { restoreFocus = true } = {}) {
    if (open) panel.hidden = false;
    // um frame depois: a transição de opacidade precisa do painel já no layout
    requestAnimationFrame(() => {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      root.style.overflow = open ? 'hidden' : '';               // trava o scroll por trás
    });
    if (!open) {
      setTimeout(() => { if (!document.body.classList.contains('menu-open')) panel.hidden = true; }, 450);
      if (restoreFocus) btn.focus({ preventScroll: true });
    } else {
      // o painel só fica visível depois do próximo quadro; focar antes falha (visibility: hidden)
      setTimeout(() => panel.querySelector('a').focus({ preventScroll: true }), 80);
    }
  }
  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';

  btn.addEventListener('click', () => setOpen(!isOpen()));
  panel.addEventListener('click', (e) => { if (e.target.closest('nav a')) setOpen(false, { restoreFocus: false }); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) setOpen(false); });
  mqNarrow.addEventListener('change', () => { if (!mqNarrow.matches && isOpen()) setOpen(false, { restoreFocus: false }); });
})();
