/* ============================================================
   Laara Digital — pricing.html signature interaction
   Staggered scroll-triggered reveal on the plan-comparison cards
   (#packages and #care-plans .pricing-grid), via self-hosted
   GSAP + ScrollTrigger (assets/vendor/gsap/, v3.15.0, already
   vendored for work.html — reused here, not re-downloaded;
   unpkg.com/gsap@3.15.0/dist/, Standard "no charge" license —
   gsap.com/standard-license).
   Scoped to pricing.html only; not loaded on any other page.
   ============================================================ */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (prefersReducedMotion || saveData) return; // default state is already the fully visible cards

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return; // vendor script failed to load — leave default visible state

  const grids = document.querySelectorAll('#packages .pricing-grid, #care-plans .pricing-grid');
  if (!grids.length) return;

  gsap.registerPlugin(ScrollTrigger);

  const rootStyles = getComputedStyle(document.documentElement);
  const revealDur = parseFloat(rootStyles.getPropertyValue('--laara-dur-reveal')) / 1000 || 0.28;
  const easeOut = rootStyles.getPropertyValue('--laara-ease-out').trim() || 'power2.out';

  grids.forEach((grid) => {
    const cards = grid.querySelectorAll('.pricing-card');
    if (!cards.length) return;

    gsap.set(cards, { opacity: 0, y: 24, scale: 0.96 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: revealDur,
      ease: easeOut,
      stagger: 0.12,
      /* Without this, GSAP leaves inline opacity/transform on each card
         after the tween completes. .pricing-card is also the element the
         universal card-hover system (style.css:46-53) applies
         translateY(-4px) scale(1.01) to on :hover — an inline transform
         left behind would permanently outrank that CSS rule and silently
         break hover-lift on every plan card after its first reveal. */
      clearProps: 'opacity,transform',
      scrollTrigger: {
        trigger: grid,
        start: 'top 82%',
        toggleActions: 'play none none none',
      },
    });
  });
})();
