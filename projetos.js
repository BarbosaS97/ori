/* =========================================================================
   Seção PROJETOS — "STUDIO ÓRI" formado; cada letra é um projeto

   Como funciona:
   • Cada bloco (.tile) é um LINK para o projeto. Passar o mouse, focar com o teclado
     ou tocar (1º toque) ATIVA o projeto: o bloco sobe e o painel ao lado troca a imagem
     com uma cortina (clip-path). Clicar num bloco já ativo — ou no painel — abre o projeto.
   • Entrada: a cada vez que a seção fica visível, os blocos "viram" em cascata (rotationY); quando ela sai
     da tela, tudo volta ao estado inicial e a entrada roda de novo na próxima vez (ver "ENTRADA" abaixo).
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

  if (!canHover) hint.textContent = 'Toque numa letra ou use as setas para ver os projetos; toque de novo para abrir.';

  /* ---------- menu ganha fundo sólido quando a seção alcança o topo ----------
     Sem ScrollTrigger: só olha onde a seção está AGORA (não depende de eventos anteriores). */
  let navTick = false;
  const updateNav = () => { navTick = false; nav.classList.toggle('is-solid', section.getBoundingClientRect().top <= 70); };
  addEventListener('scroll', () => { if (!navTick) { navTick = true; requestAnimationFrame(updateNav); } }, { passive: true });
  addEventListener('resize', updateNav);
  document.addEventListener('hero-ready', updateNav);
  updateNav();

  /* ---------- estado ---------- */
  let cur = 0;                              // índice do projeto ativo
  let inView = false;
  let barTween = null;

  // Estado "de fábrica": o que vale na 1ª entrada e volta a valer a cada reset.
  // Voltando de uma página de projeto (?ativo=slug), o painel abre nesse projeto, sem autoplay.
  const wanted = new URLSearchParams(location.search).get('ativo');
  const wantedIdx = tiles.findIndex((t) => t.dataset.slug === wanted);
  const initialIdx = wantedIdx >= 0 ? wantedIdx : 0;
  const initialAuto = !reduce && wantedIdx < 0;
  let autoOn = initialAuto;                 // autoplay ligado?

  // troca o projeto ativo SEM animação (estado inicial e reset)
  function setActive(i) {
    cur = i;
    tiles.forEach((t, k) => {
      t.classList.toggle('is-active', k === i);
      k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current');
    });
    pvs.forEach((p, k) => p.classList.toggle('is-active', k === i));
    countEl.textContent = String(i + 1).padStart(2, '0');
  }
  setActive(initialIdx);

  /* ---------- CARREGAMENTO da prévia ----------
     As fotos só começam a baixar quando precisam (loadPv): perto da seção ou ao avançar até o projeto.
     Enquanto a foto não chega, o painel mostra o loader (logo + barra, como no início do site).
     Ele some (.is-loaded) quando a foto termina; erro de rede também libera (fica o degradê). */
  function loadPv(p) {
    const im = p.querySelector('.pv__img img');
    if (!im || im.dataset.started) return;
    im.dataset.started = '1';
    const done = () => p.classList.add('is-loaded');
    im.addEventListener('load', done, { once: true });
    im.addEventListener('error', done, { once: true });
    im.srcset = im.dataset.srcset;
    im.src = im.dataset.src;
    if (im.complete && im.naturalWidth > 1) done();            // já estava em cache
  }
  const loadAll = () => { loadPv(pvs[cur]); pvs.forEach((p, k) => setTimeout(() => loadPv(p), 250 + k * 120)); };

  // Só começa a observar quando o hero já criou o espaço do scroll (antes disso a seção parece estar
  // logo abaixo da tela e as 9 fotos baixariam de uma vez, competindo com o hero).
  let watching = false;
  function watchSection() {
    if (watching) return;
    watching = true;
    if (!('IntersectionObserver' in window)) { loadAll(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { loadPv(pvs[cur]); io.disconnect(); }   // a 1 tela de distância: aquece só o painel ativo
    }, { rootMargin: '900px 0px' });
    io.observe(section);
  }
  if (window.heroReady) watchSection(); else document.addEventListener('hero-ready', watchSection, { once: true });
  setTimeout(watchSection, 5000);                              // rede de segurança (ex.: hero sem JS)

  /* ---------- ATIVAR um projeto ---------- */
  function activate(i, { auto = false, dir: forcedDir } = {}) {
    if (!auto && autoOn) stopAuto();        // qualquer gesto do usuário para o autoplay
    if (i === cur) return;

    const prev = pvs[cur], next = pvs[i];
    const dir = forcedDir || (i > cur ? 1 : -1);   // a cortina entra pelo lado do sentido da troca (as setas dão a volta: último → primeiro)
    cur = i;

    tiles.forEach((t, k) => {
      const on = k === i;
      t.classList.toggle('is-active', on);
      on ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current');
    });
    countEl.textContent = String(i + 1).padStart(2, '0');

    loadPv(next);                                      // garante que a foto comece a baixar agora

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

  /* ---------- Setas laterais da prévia (celular) e swipe: anterior / próximo, dando a volta ---------- */
  const step = (d) => activate((cur + d + N) % N, { dir: d });
  document.getElementById('pvPrev').addEventListener('click', () => step(-1));
  document.getElementById('pvNext').addEventListener('click', () => step(1));

  const frame = document.getElementById('pvFrame');
  let sw = null;
  frame.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') sw = { x: e.clientX, y: e.clientY }; });
  frame.addEventListener('pointercancel', () => { sw = null; });
  frame.addEventListener('pointerup', (e) => {
    if (!sw) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    sw = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);   // deslizar p/ a esquerda = próximo
  });

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

  /* ---------- ENTRADA: máquina de estados dirigida pela VISIBILIDADE REAL da seção ----------
     Antes a entrada rodava uma única vez, quando o ScrollTrigger cruzava um ponto de scroll. Ela podia rodar
     escondida (atrás do loader, ao voltar de uma página de projeto com #projetos) ou nunca mais rodar.
     Agora:  seção visível  →  a entrada roda do zero (letras entram uma a uma);
             seção fora da tela  →  tudo volta ao estado inicial, pronto para rodar de novo.
     Só depende de "a seção está na tela agora?" — não de posição de scroll nem de estado acumulado. */
  if (reduce || !window.gsap) { setBtn(); watchSection(); loadAll(); return; }

  const faces = tiles.map((t) => t.querySelector('.tile__face'));
  const frameEl = document.getElementById('pvFrame');
  let visible = false;      // a seção está suficientemente visível (IntersectionObserver)
  let shown = false;        // a entrada já rodou desde o último reset
  let canPlay = false;      // hero pronto (espaço do scroll criado, loader saindo): antes disso o layout ainda muda
  let entryTl = null;

  const hideAll = () => {
    gsap.set(faces, { autoAlpha: 0, rotationY: -90, y: 46, transformPerspective: 700 });
    gsap.set(frameEl, { autoAlpha: 0, y: 30 });
  };
  hideAll();                // letras e painel começam escondidos

  function reset() {
    shown = false; inView = false;
    if (entryTl) { entryTl.kill(); entryTl = null; }
    killBar();
    // interrompe qualquer troca de projeto em andamento e limpa o que ela deixou nos elementos
    gsap.killTweensOf([...faces, frameEl]);
    pvs.forEach((p) => {
      const img = p.querySelector('.pv__img'), caps = p.querySelectorAll('.pv__cap > *');
      gsap.killTweensOf([p, img, ...caps]);
      gsap.set(p, { clearProps: 'clipPath,zIndex' });
      gsap.set(img, { clearProps: 'transform' });
      gsap.set(caps, { clearProps: 'all' });
    });
    hideAll();
    setActive(initialIdx);
    autoOn = initialAuto; setBtn();
  }

  function play() {
    shown = true; inView = true;
    hideAll();
    entryTl = gsap.timeline();
    entryTl
      .fromTo(faces, { rotationY: -90, y: 46, autoAlpha: 0, transformPerspective: 700 },
        { rotationY: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.5)', stagger: 0.07 }, 0)
      .fromTo(frameEl, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.5)
      .fromTo(pvs[cur].querySelector('.pv__img'), { scale: 1.16 }, { scale: 1, duration: 1.5, ease: 'power3.out' }, 0.5)
      .call(startAuto, null, 1.6);            // o autoplay só começa depois que as letras entraram
    loadAll();                                // as capas vão chegando (evita "pop-in" ao passar o mouse)
  }

  function sync() {
    if (visible && canPlay && !shown) play();
    else if (!visible && shown) reset();
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      // Histerese: entra com >= 15% visível e só reseta quando sobra < 3%. (Saltar por âncora para a seção vizinha
      // deixa um fiapo de < 1 px na tela: a razão é ~0,0004, não 0 exato, e isIntersecting continua true.)
      if (e.intersectionRatio >= 0.15) visible = true;
      else if (e.intersectionRatio < 0.03) visible = false;
      sync();
    }, { threshold: [0, 0.03, 0.15] });
    io.observe(section);

    // voltar pelo botão "voltar" do navegador (cache de página inteira): recomeça limpo
    addEventListener('pageshow', (e) => {
      if (!e.persisted) return;
      reset(); visible = false; io.unobserve(section); io.observe(section);
    });
  } else {
    visible = true;                                         // navegador antigo: mostra e pronto
  }

  // libera a entrada só depois que o hero criou o espaço do scroll (antes o layout ainda vai mudar)
  const allow = () => { if (canPlay) return; canPlay = true; sync(); };
  if (window.heroReady) setTimeout(allow, 600);
  else document.addEventListener('hero-ready', () => setTimeout(allow, 600), { once: true });
  setTimeout(allow, 6000);                                  // rede de segurança

  setBtn();
})();
