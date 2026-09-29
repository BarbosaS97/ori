/* Hero Studio Óri — a câmera atravessa a foto das sócias, abre um portal,
   entra no ambiente e chega ao desenho técnico. Tudo dirigido pelo scroll.

   Uma única função pura, render(p), mapeia o progresso (0–1) para o estado
   visual. Isso deixa o comportamento testável: ?p=0.5 congela o hero no meio. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const hero = $('hero'), stage = $('stage');
  const photo = $('photo'), sceneA = $('sceneA'), headline = $('headline'), hint = $('hint');
  const portal = $('portal'), filmwrap = $('filmwrap'), canvas = $('film');
  const veil = $('veil'), endtext = $('endtext'), ring = $('ring');
  const nav = $('nav'), label = $('label'), tag = $('tag'), skip = $('skip');
  const loader = $('loader'), loaderBar = $('loaderBar');
  const hud = document.querySelector('.hud');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portrait = matchMedia('(max-width: 860px), (max-aspect-ratio: 4/5)').matches;
  const debugP = new URLSearchParams(location.search).get('p');

  /* ---------- Sequência de frames ---------- */
  const N = 201;
  const dir = portrait ? 'assets/frames-m/' : 'assets/frames-d/';
  const frames = new Array(N);
  const ctx = canvas.getContext('2d', { alpha: false });
  let cw = 0, ch = 0, lastDrawn = -1;

  const load = (i) => new Promise((done) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { frames[i] = im; done(true); };
    im.onerror = () => done(false);
    im.src = dir + String(i).padStart(3, '0') + '.webp';
  });

  // Ordem de carregamento: esqueleto grosso primeiro, depois refina.
  // O scroll já funciona com poucos frames (usa o mais próximo carregado).
  const order = [];
  const seen = new Set();
  [40, 10, 4, 2, 1].forEach((stride) => {
    for (let i = 0; i < N; i += stride) if (!seen.has(i)) { seen.add(i); order.push(i); }
    if (!seen.has(N - 1)) { seen.add(N - 1); order.push(N - 1); }
  });
  const firstBatch = order.filter((i) => i % 10 === 0 || i === N - 1).length;

  async function loadFrames(list, onProgress) {
    let idx = 0, n = 0;
    const worker = async () => {
      while (idx < list.length) {
        const i = list[idx++];
        await load(i);
        onProgress && onProgress(++n);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
  }

  const nearest = (i) => {
    for (let d = 0; d < N; d++) {
      if (frames[i - d]) return i - d;
      if (frames[i + d]) return i + d;
    }
    return -1;
  };

  function sizeCanvas() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(dpr, 1920 / Math.max(r.width, 1));
    cw = canvas.width = Math.round(r.width * scale);
    ch = canvas.height = Math.round(r.height * scale);
    lastDrawn = -1;
  }

  function draw(i) {
    const k = nearest(i);
    if (k < 0 || k === lastDrawn) return;
    const im = frames[k];
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
    lastDrawn = k;
  }

  /* ---------- Helpers de animação ---------- */
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- Linha do tempo (fração do scroll do hero) ----------
     0.05–0.14  título sai
     0.08–0.38  câmera avança; sócias ficam para trás e saem pela borda
     0.30–0.50  portal "O" abre na parede
     0.34–0.90  scroll dirige o vídeo (frames 0→200)
     0.80–0.92  véu off-white
     0.87–0.96  texto final                                            */
  let cur = -1;
  let labelText = '';

  function render(p) {
    const r = stage.getBoundingClientRect();
    const w = r.width, h = r.height;
    const cs = getComputedStyle(stage);
    const ox = parseFloat(cs.getPropertyValue('--ox')) / 100;
    const oy = parseFloat(cs.getPropertyValue('--oy')) / 100;

    // Cena 1–2: câmera avança. Escala a partir do ponto de fuga (parede à direita),
    // então as sócias, à esquerda dele, deslizam para fora do quadro.
    const push = easeInOut(seg(p, .08, .38));
    photo.style.transform = `scale(${(1 + 1.9 * push).toFixed(4)})`;
    sceneA.style.opacity = (1 - seg(p, .42, .50)).toFixed(3);

    const hOut = seg(p, .04, .14);
    headline.style.opacity = (1 - hOut).toFixed(3);
    headline.style.transform = `translate3d(0, ${(-36 * easeOut(hOut)).toFixed(1)}px, 0)`;
    hint.style.opacity = (1 - seg(p, 0, .04)).toFixed(3);

    // Cena 3: portal circular centrado no ponto de fuga
    const px = ox * w, py = oy * h;
    const maxR = Math.max(Math.hypot(px, py), Math.hypot(w - px, py), Math.hypot(px, h - py), Math.hypot(w - px, h - py)) + 4;
    const open = easeInOut(seg(p, .30, .50));
    const rad = open * maxR;
    portal.style.visibility = rad > 0.5 ? 'visible' : 'hidden';
    portal.style.clipPath = open >= 1 ? 'none' : `circle(${rad.toFixed(1)}px at ${px.toFixed(1)}px ${py.toFixed(1)}px)`;
    filmwrap.style.transform = `scale(${(1.22 - .22 * easeOut(seg(p, .30, .62))).toFixed(4)})`;

    ring.style.width = ring.style.height = `${(rad * 2).toFixed(1)}px`;
    ring.style.opacity = rad > 0.5 ? (1 - seg(p, .44, .50)).toFixed(3) : 0;

    // Cena 4: o scroll dirige o vídeo
    const f = Math.round(seg(p, .34, .90) * (N - 1));
    draw(f);

    // Cena 5: véu + texto final
    veil.style.opacity = seg(p, .80, .92).toFixed(3);
    const t = seg(p, .87, .96);
    endtext.style.opacity = t.toFixed(3);
    endtext.style.transform = `translate3d(0, ${(24 * (1 - easeOut(t))).toFixed(1)}px, 0)`;
    endtext.classList.toggle('is-live', t > .6);

    // HUD, navegação e etiqueta de estágio
    const dark = p > .44 && p < .80;
    nav.classList.toggle('on-dark', dark);
    hud.classList.toggle('on-dark', dark);
    skip.classList.toggle('on-dark', dark);
    skip.style.opacity = p > .93 ? 0 : 1;
    skip.style.pointerEvents = p > .93 ? 'none' : 'auto';
    tag.style.opacity = seg(p, .46, .52) * (1 - seg(p, .88, .92));

    const next = p < .32 ? '01 · escuta' : p < .78 ? '02 · projeto' : '03 · desenho';
    if (next !== labelText) { label.textContent = next; labelText = next; }
    cur = p;
  }

  /* ---------- Inicialização ---------- */
  async function init() {
    sizeCanvas();

    if (reduce) {
      hero.classList.add('reduced');
      await load(N - 1);
      draw(N - 1);
      finishLoader();
      return;
    }

    // Foto das sócias + primeiro lote de frames antes de revelar a página
    const photoReady = new Promise((res) => {
      const im = photo.querySelector('img');
      im.complete ? res() : (im.onload = im.onerror = res);
    });
    const batch = order.slice(0, firstBatch);
    const rest = order.slice(firstBatch);
    await Promise.all([
      photoReady,
      loadFrames(batch, (n) => { loaderBar.style.transform = `scaleX(${(n / batch.length).toFixed(3)})`; }),
    ]);
    render(debugP !== null ? parseFloat(debugP) : 0);
    finishLoader();
    loadFrames(rest).then(() => { lastDrawn = -1; render(cur); });   // refina em segundo plano

    if (debugP !== null) {           // congela em um ponto (para testes/capturas)
      hero.style.height = '100vh';
      skip.hidden = true;
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const state = { p: 0 };
    const length = portrait ? 4.2 : 5.5;   // altura do scroll do hero, em telas
    gsap.to(state, {
      p: 1, ease: 'none',
      scrollTrigger: {
        id: 'hero',
        trigger: hero, start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * length),
        pin: stage, pinSpacing: true, anticipatePin: 1,
        refreshPriority: 1,   // mede o pin do hero ANTES dos triggers das seções seguintes (que dependem do espaçamento dele)
        scrub: .6,
        invalidateOnRefresh: true,
      },
      onUpdate: () => render(state.p),
    });

    skip.addEventListener('click', () => {
      const st = ScrollTrigger.getById('hero');
      window.scrollTo({ top: st.end, behavior: 'smooth' });
    });

    let raf;
    addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { sizeCanvas(); render(cur < 0 ? 0 : cur); });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  function finishLoader() { requestAnimationFrame(() => loader.classList.add('is-done')); }

  init();
})();
