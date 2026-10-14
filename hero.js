/* =========================================================================
   Hero estático (a abertura animada foi retirada a pedido da cliente: interface mais simples).
   Só avisa as seções abaixo que a página está pronta — projetos.js espera por este sinal.
   ========================================================================= */
(() => {
  window.heroReady = true;
  document.dispatchEvent(new Event('hero-ready'));
})();
