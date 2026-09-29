/* =========================================================================
   Seção SOBRE — entrada suave ao rolar (só com movimento permitido)

   Sequência: o bloco verde-sálvia se estende da esquerda, a foto é revelada de
   baixo para cima (clip-path) e o texto sobe em cascata. O HTML é estático, então
   sem JS ou com prefers-reduced-motion tudo aparece direto, sem animação.
   ========================================================================= */
(() => {
  'use strict';

  const media = document.getElementById('aboutMedia');
  const text = document.getElementById('aboutText');
  if (!media || !text) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const img = media.querySelector('img');
  const once = (trigger) => ({ trigger, start: 'top 78%', once: true });

  // O bloco verde é um ::before (não dá para animar direto): animamos a variável CSS --block, que o CSS lê.
  const tl = gsap.timeline({ scrollTrigger: once(media), defaults: { ease: 'power3.out' } });
  tl.fromTo(media, { '--block': 0 }, { '--block': 1, duration: 0.9 }, 0)
    .fromTo(img, { clipPath: 'inset(100% 0 0 0)', scale: 1.08 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.3 }, 0.15);

  gsap.from(text.children, {
    y: 30, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.11,
    scrollTrigger: once(text),
  });
})();
