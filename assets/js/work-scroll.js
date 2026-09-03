/* ============================================================
   Laara Digital — work.html signature interaction
   Scrubbed clip-path reveal on the Client work / Concept lab grid
   images, via self-hosted GSAP + ScrollTrigger
   (assets/vendor/gsap/, v3.15.0, unpkg.com/gsap@3.15.0/dist/,
   Standard "no charge" license — gsap.com/standard-license).
   Scoped to work.html only; not loaded on any other page.
   ============================================================ */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (prefersReducedMotion || saveData) return; // default state is already the fully visible image

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return; // vendor script failed to load — leave default visible state

  const scrubEls = document.querySelectorAll('.client-work-grid [data-scroll-scrub], .concept-grid [data-scroll-scrub]');
  if (!scrubEls.length) return;

  gsap.registerPlugin(ScrollTrigger);

  const rootStyles = getComputedStyle(document.documentElement);
  /* Reusing --laara-dur-section (500ms) as the scrub lag rather than adding
     a dedicated token — this is the first scroll-scrub interaction on the
     site, so there's nothing yet to compare a bespoke token against. Worth
     splitting out its own --laara-dur-scrub token once a second scrub
     interaction exists and we can see whether they actually want to share
     a value. */
  const sectionDurMs = parseFloat(rootStyles.getPropertyValue('--laara-dur-section')) || 500;
  const scrubLag = sectionDurMs / 1000; // 500ms -> 0.5

  scrubEls.forEach((el) => {
    gsap.set(el, { clipPath: 'inset(0% 0% 0% 100%)', scale: 1.08, transformOrigin: 'center center' });
    gsap.to(el, {
      clipPath: 'inset(0% 0% 0% 0%)',
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 40%',
        scrub: scrubLag,
      },
    });
  });

  /* The filter pills (main.js) toggle .is-hidden (display:none) on
     .case-card, which changes page height — refresh so cached
     ScrollTrigger start/end positions don't go stale after a filter click. */
  document.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => requestAnimationFrame(() => ScrollTrigger.refresh()));
  });
})();
