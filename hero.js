/* Hero Studio Óri — a câmera atravessa a foto das sócias, abre um portal,
   entra no ambiente e chega ao desenho técnico. Tudo dirigido pelo scroll.

   Uma única função, render(p), mapeia o progresso (0–1) para o estado visual.
   Isso deixa o comportamento testável: ?p=0.5 congela o hero no meio.

   Desempenho (resultado de auditoria):
   • O loader sai assim que a FOTO do hero chega — a 1ª tela não depende dos frames.
   • Os 201 frames começam a baixar logo depois. Ordem: esqueleto grosso primeiro, então o scroll
     funciona mesmo com poucos frames (usa o mais próximo).
   • Com "economia de dados" ou rede 2G, baixa só 1 a cada 4 frames.
   • DECODIFICAÇÃO FORA DA THREAD PRINCIPAL. O trace do navegador mostrou ~7 ms de "Decode" na thread
     principal a cada troca de frame (drawImage de um <img> WebP) — é isso que travava o scroll.
     Agora cada frame é baixado como Blob e decodificado com createImageBitmap(blob), que roda em
     thread de trabalho. Só uma janela de ~16 frames fica decodificada, com pré-decodificação no
     sentido do scroll; se o scroll for mais rápido que a decodificação, mostra o frame pronto mais próximo.
   • Como o download usa fetch(), ele nem atrasa o evento `load`.
   • O canvas usa a resolução NATIVA dos frames (não a da tela): menos pixels para rasterizar.
   • Medidas de layout ficam em cache (nada de getComputedStyle a cada tick de scroll). */
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
  // Frames verticais só em tela estreita E mais alta que larga (celular em pé). Celular deitado e tablet usam os horizontais.
  const mqPortrait = matchMedia('(max-width: 600px) and (max-aspect-ratio: 1/1)');
  let portrait = mqPortrait.matches;
  const debugP = new URLSearchParams(location.search).get('p');

  /* ---------- Sequência de frames ---------- */
  const N = 201;
  const SETS = {                                 // dimensões nativas de cada conjunto
    landscape: { dir: 'assets/frames-d/', w: 1280, h: 720 },
    portrait:  { dir: 'assets/frames-m/', w: 405,  h: 720 },
  };
  let set = portrait ? SETS.portrait : SETS.landscape;
  let blobs = new Array(N);                      // frames COMPRIMIDOS (Blob, ~40 KB cada) já baixados
  const bmps = new Map();                        // frame -> ImageBitmap decodificado (só uma janela ao redor do atual)
  const pending = new Set();                     // frames em decodificação agora
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingQuality = 'low';
  let cw = 0, ch = 0, lastDrawn = -1, gen = 0;   // gen: invalida trabalho antigo ao trocar de conjunto
  let target = 0, dirn = 1;                      // frame desejado e sentido do scroll
  const HAS_BITMAP = 'createImageBitmap' in window;

  async function fetchFrame(i, g) {
    try {
      const r = await fetch(set.dir + String(i).padStart(3, '0') + '.webp');
      if (!r.ok) return;
      const b = await r.blob();
      if (g === gen) { blobs[i] = b; pump(); }
    } catch (e) { /* frame indisponível: o scroll usa o vizinho */ }
  }

  // Ordem de carregamento: esqueleto grosso primeiro (a cada 40, 10, 4, 2, 1)
  const order = [];
  const seen = new Set();
  [40, 10, 4, 2, 1].forEach((stride) => {
    for (let i = 0; i < N; i += stride) if (!seen.has(i)) { seen.add(i); order.push(i); }
    if (!seen.has(N - 1)) { seen.add(N - 1); order.push(N - 1); }
  });
  const firstBatch = order.filter((i) => i % 10 === 0 || i === N - 1).length;

  // economia de dados / rede muito lenta: 1 a cada 4 frames (o scroll usa o mais próximo)
  const conn = navigator.connection;
  const lite = !!conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));

  async function loadFrames(list, concurrency = 6) {
    const g = gen;
    let idx = 0;
    const worker = async () => {
      while (idx < list.length && g === gen) await fetchFrame(list[idx++], g);
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  // frame decodificado mais próximo de i
  const nearestBmp = (i) => {
    for (let d = 0; d < N; d++) {
      if (bmps.has(i - d)) return i - d;
      if (bmps.has(i + d)) return i + d;
    }
    return -1;
  };

  // Janela de decodificação: mais à frente (no sentido do scroll) do que atrás
  const FWD = 12, BACK = 4, MAX_INFLIGHT = 3;
  function evict() {
    for (const [i, bm] of bmps) {
      if (i < target - BACK - 3 || i > target + FWD + 3) { bm.close(); bmps.delete(i); }
    }
  }
  // Pede a decodificação (em thread de trabalho) dos frames mais próximos do alvo que ainda faltam
  function pump() {
    if (!HAS_BITMAP) return;
    const g = gen;
    for (let d = 0; d <= FWD && pending.size < MAX_INFLIGHT; d++) {
      for (const off of (d === 0 ? [0] : dirn >= 0 ? [d, -d] : [-d, d])) {
        const i = target + off;
        if (i < 0 || i >= N || !blobs[i] || bmps.has(i) || pending.has(i)) continue;
        if (off < -BACK || off > FWD) continue;
        pending.add(i);
        createImageBitmap(blobs[i]).then((bm) => {
          pending.delete(i);
          if (g !== gen) { bm.close(); return; }
          bmps.set(i, bm);
          evict(); paint(); pump();
        }).catch(() => { pending.delete(i); blobs[i] = null; });
        if (pending.size >= MAX_INFLIGHT) return;
      }
    }
  }

  /* Canvas em resolução nativa: 1 px do canvas = 1 px do frame ao "cobrir" a tela.
     (Antes: 1440×810 na tela de desktop e 780×1688 no celular retina — bem mais pixels do que o frame tem.) */
  function sizeCanvas() {
    const r = stage.getBoundingClientRect();
    const sCss = Math.max(r.width / set.w, r.height / set.h);     // px de tela por px do frame
    const k = Math.min(Math.min(window.devicePixelRatio || 1, 2), 1 / Math.max(sCss, 0.0001));
    cw = canvas.width = Math.max(1, Math.round(r.width * k));
    ch = canvas.height = Math.max(1, Math.round(r.height * k));
    ctx.fillStyle = '#3b2a1f'; ctx.fillRect(0, 0, cw, ch);       // tom do 1º frame: sem "flash" preto antes do 1º desenho
    lastDrawn = -1;
    paint();                                                     // redimensionar apaga o canvas: repõe o frame atual
  }

  // Desenha o frame decodificado mais próximo do alvo (drawImage de ImageBitmap não decodifica nada)
  function paint() {
    const k = nearestBmp(target);
    if (k < 0 || k === lastDrawn) return;
    const bm = bmps.get(k);
    const s = Math.max(cw / bm.width, ch / bm.height);
    const w = bm.width * s, h = bm.height * s;
    ctx.drawImage(bm, (cw - w) / 2, (ch - h) / 2, w, h);
    lastDrawn = k;
  }
  function draw(i) {
    if (i !== target) { dirn = i > target ? 1 : -1; target = i; }
    pump(); paint();
  }

  /* ---------- Medidas em cache ---------- */
  let W = 0, H = 0, PX = 0, PY = 0, MAXR = 0;
  function measure() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    const cs = getComputedStyle(stage);
    PX = (parseFloat(cs.getPropertyValue('--ox')) / 100) * W;    // ponto de fuga (onde a câmera "entra")
    PY = (parseFloat(cs.getPropertyValue('--oy')) / 100) * H;
    MAXR = Math.max(Math.hypot(PX, PY), Math.hypot(W - PX, PY), Math.hypot(PX, H - PY), Math.hypot(W - PX, H - PY)) + 4;
  }

  /* ---------- Helpers de animação ---------- */
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // escreve um estilo só se mudou (evita recalcular estilo à toa a cada tick)
  const put = (el, prop, val) => {
    const c = el.__c || (el.__c = {});
    if (c[prop] !== val) { c[prop] = val; el.style[prop] = val; }
  };

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
    if (!W) measure();

    // Cena 1–2: câmera avança. Escala a partir do ponto de fuga (parede à direita),
    // então as sócias, à esquerda dele, deslizam para fora do quadro.
    const push = easeInOut(seg(p, .08, .38));
    put(photo, 'transform', `scale(${(1 + 1.9 * push).toFixed(4)})`);
    put(sceneA, 'opacity', (1 - seg(p, .42, .50)).toFixed(3));

    const hOut = seg(p, .04, .14);
    put(headline, 'opacity', (1 - hOut).toFixed(3));
    put(headline, 'transform', `translate3d(0, ${(-36 * easeOut(hOut)).toFixed(1)}px, 0)`);
    put(hint, 'opacity', (1 - seg(p, 0, .04)).toFixed(3));

    // Cena 3: portal circular centrado no ponto de fuga
    const open = easeInOut(seg(p, .30, .50));
    const rad = open * MAXR;
    put(portal, 'visibility', rad > 0.5 ? 'visible' : 'hidden');
    put(portal, 'clipPath', open >= 1 ? 'none' : `circle(${rad.toFixed(1)}px at ${PX.toFixed(1)}px ${PY.toFixed(1)}px)`);
    put(filmwrap, 'transform', `scale(${(1.22 - .22 * easeOut(seg(p, .30, .62))).toFixed(4)})`);

    const d = `${(rad * 2).toFixed(1)}px`;
    put(ring, 'width', d); put(ring, 'height', d);
    put(ring, 'opacity', rad > 0.5 ? (1 - seg(p, .44, .50)).toFixed(3) : '0');

    // Cena 4: o scroll dirige o vídeo (só desenha quando o portal já aparece)
    if (p > .30) draw(Math.round(seg(p, .34, .90) * (N - 1)));

    // Cena 5: véu + texto final
    put(veil, 'opacity', seg(p, .80, .92).toFixed(3));
    const t = seg(p, .87, .96);
    put(endtext, 'opacity', t.toFixed(3));
    put(endtext, 'transform', `translate3d(0, ${(24 * (1 - easeOut(t))).toFixed(1)}px, 0)`);
    endtext.classList.toggle('is-live', t > .6);

    // HUD, navegação e etiqueta de estágio
    const dark = p > .44 && p < .80;
    nav.classList.toggle('on-dark', dark);
    hud.classList.toggle('on-dark', dark);
    skip.classList.toggle('on-dark', dark);
    put(skip, 'opacity', p > .93 ? '0' : '1');
    put(skip, 'pointerEvents', p > .93 ? 'none' : 'auto');
    put(tag, 'opacity', String(+(seg(p, .46, .52) * (1 - seg(p, .88, .92))).toFixed(3)));

    const next = p < .32 ? '01 · escuta' : p < .78 ? '02 · projeto' : '03 · desenho';
    if (next !== labelText) { label.textContent = next; labelText = next; }
    cur = p;
  }

  /* ---------- Carregamento dos frames em segundo plano ---------- */
  function startBackgroundLoad() {
    const list = lite ? order.filter((i) => i % 4 === 0 || i === N - 1) : order;
    loadFrames(list, portrait ? 4 : 6);                 // fetch() não atrasa o evento `load`
  }

  /* Girou o aparelho / mudou o tamanho da janela: troca entre frames verticais e horizontais */
  function swapSet() {
    if (mqPortrait.matches === portrait) return;
    portrait = mqPortrait.matches;
    set = portrait ? SETS.portrait : SETS.landscape;
    gen++; blobs = new Array(N); pending.clear(); bmps.forEach((bm) => bm.close()); bmps.clear();
    sizeCanvas(); measure();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    startBackgroundLoad(); render(cur < 0 ? 0 : cur);
  }

  /* ---------- Inicialização ---------- */
  async function init() {
    sizeCanvas(); measure();

    if (reduce) {
      hero.classList.add('reduced');
      try {                                            // 1 frame estático (o último: planta técnica)
        const b = await (await fetch(set.dir + String(N - 1).padStart(3, '0') + '.webp')).blob();
        bmps.set(N - 1, await createImageBitmap(b));
        target = N - 1; paint();
      } catch (e) { /* mantém o fundo */ }
      finishLoader();
      document.dispatchEvent(new Event('hero-ready'));
      return;
    }

    // A primeira tela só precisa da FOTO. (Timeout de segurança: 8 s.)
    loaderBar.style.transform = 'scaleX(.35)';
    const im = photo.querySelector('img');
    const photoReady = new Promise((res) => { im.complete ? res() : (im.onload = im.onerror = res); });
    await Promise.race([photoReady, new Promise((res) => setTimeout(res, 8000))]);
    loaderBar.style.transform = 'scaleX(1)';

    if (debugP !== null) {           // modo de teste: garante frames baixados e decodificados antes de "congelar"
      await loadFrames(order.slice(0, firstBatch));
      const f = Math.round(seg(parseFloat(debugP), .34, .90) * (N - 1));
      target = f; pump();
      for (let n = 0; n < 40 && nearestBmp(f) < 0; n++) await new Promise((r) => setTimeout(r, 100));
    }
    render(debugP !== null ? parseFloat(debugP) : 0);
    finishLoader();
    if (debugP !== null) {           // congela em um ponto (para testes/capturas)
      hero.style.height = '100vh';
      skip.hidden = true;
      startBackgroundLoad();
      document.dispatchEvent(new Event('hero-ready'));
      return;
    }
    startBackgroundLoad();

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    // Depois de cada refresh (o pin já tem as dimensões novas) refaz canvas e medidas. Ler o tamanho do palco
    // direto no evento `resize` devolvia o valor ANTIGO (o pin mantém px fixos até o refresh).
    ScrollTrigger.addEventListener('refresh', () => { sizeCanvas(); measure(); render(cur < 0 ? 0 : cur); });

    const state = { p: 0 };
    gsap.to(state, {
      p: 1, ease: 'none',
      scrollTrigger: {
        id: 'hero',
        trigger: hero, start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * (portrait ? 4.2 : 5.5)),   // altura do scroll do hero, em telas
        pin: stage, pinSpacing: true, anticipatePin: 1,
        refreshPriority: 1,   // mede o pin do hero ANTES dos triggers das seções seguintes (que dependem do espaçamento dele)
        scrub: .6,
        invalidateOnRefresh: true,
      },
      onUpdate: () => render(state.p),
    });

    // link direto (#projetos, voltar de outra página): o navegador rolou antes do pin existir; refaz a rolagem
    if (location.hash.length > 1) {
      try {
        const target = document.querySelector(location.hash);
        if (target) requestAnimationFrame(() => { ScrollTrigger.refresh(); target.scrollIntoView(); });
      } catch (e) { /* hash não é um seletor válido: ignora */ }
    }

    document.dispatchEvent(new Event('hero-ready'));   // o pin já existe: as seções abaixo sabem onde realmente estão

    skip.addEventListener('click', () => {
      const st = ScrollTrigger.getById('hero');
      window.scrollTo({ top: st.end, behavior: 'smooth' });
    });

    let raf;
    addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(swapSet);                       // canvas e medidas são refeitos no refresh do ScrollTrigger
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  function finishLoader() { requestAnimationFrame(() => loader.classList.add('is-done')); }

  init();
})();
