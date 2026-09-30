/* Página "todos os projetos": filtro por tipo (?tipo=comercial) e entrada dos cartões. Sem dependências. */
(function () {
  document.documentElement.classList.add('js');
  var list = document.getElementById('plList');
  var cards = Array.prototype.slice.call(list.children);
  var btns = Array.prototype.slice.call(document.querySelectorAll('.pfilter__btn'));
  var status = document.getElementById('plStatus');

  function show(el) { el.classList.add('is-in'); }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  cards.forEach(function (c) { if (io) io.observe(c); else show(c); });

  function apply(f, push) {
    var n = 0;
    cards.forEach(function (c) {
      var ok = f === 'todos' || c.getAttribute('data-tipo') === f;
      c.hidden = !ok;
      if (ok) { n++; show(c); }
    });
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === f ? 'true' : 'false'); });
    status.textContent = n + (n === 1 ? ' projeto' : ' projetos') + (f === 'todos' ? '' : ' — ' + f);
    if (push) {
      try { history.replaceState(null, '', f === 'todos' ? location.pathname : '?tipo=' + f); } catch (e) {}
    }
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-f'), true); }); });

  var q = new URLSearchParams(location.search).get('tipo');
  if (q && btns.some(function (b) { return b.getAttribute('data-f') === q; })) apply(q, false);
})();
