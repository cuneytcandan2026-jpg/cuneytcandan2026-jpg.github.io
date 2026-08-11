# Laara Digital — Website Design & Animation Concept Brief

**Purpose:** Reference doc for building laaradigital.co.uk. Content/services are being handled separately (Claude Code) — this covers *look, feel, motion and interaction* only, borrowed as concepts (not code/assets) from marino.co.uk and cbwebsitedesign.co.uk, adapted to the locked Laara brand system and the actual audience (small UK local businesses, older-skewing, mostly on mobile).

**Non-negotiables (from CLAUDE.md — do not trade these away for a cool animation):**
WCAG 2.2 AA · 16px minimum body text · 48px minimum controls · 44px touch targets · visible keyboard focus · one H1 · mobile-first · green `#12B76A` never as text/background pairing that fails contrast (ink text on green buttons, `#0D844D` for green text on light, never white-on-green) · respect `prefers-reduced-motion` on every animation below · Lato only (Archivo Black is logo-only, not for web type).

---

## Interaction & animation concepts to borrow

Priority reflects impact-vs-effort for a site that needs to load fast on mid-range phones — not how impressive each effect looks in isolation.

**High priority**

1. **Scroll-triggered reveals** — sections/cards fade + slide in slightly as they enter the viewport (Marino and CreativeWeb both use this). Cheap to build (Intersection Observer + CSS transitions, no heavy library needed), big perceived-quality lift, negligible performance cost. Use short duration (300–450ms), small translate distance (16–24px) — subtle, not bouncy.
2. **Hover/tap micro-interactions on cards and buttons** — slight lift + shadow increase + colour shift on service cards, buttons scaling ~2-3% on hover. Reinforces the "premium, cared-for" feel CreativeWeb has. On touch devices, replace hover with a tap-state equivalent (don't rely on hover alone — most of your traffic is mobile).
3. **Animated stat/counter numbers** — e.g. "40+ local businesses helped," review count, average turnaround days — counting up once when scrolled into view. Both reference sites use this stat-flex pattern; yours will use honest local numbers instead of Marino's £100M-style corporate stats.
4. **Sticky/smart header** — hides on scroll-down, reappears on scroll-up, always keeps the phone number/WhatsApp CTA visible. High conversion value for a call-driven audience, standard on both reference sites.

**Medium priority**

5. **Smooth scroll** (Lenis or similar lightweight library) — gives the page the "expensive" glide feel both sites have instead of default browser scroll jump. Small file size, easy to add. Must not break native scroll behaviour for accessibility tools or keyboard scrolling.
6. **Marquee/ticker strip** — a slow-scrolling row of trust logos, sectors served, or review snippets (CreativeWeb-style trust bar, Marino's client-logo row). Pause on hover/tap, and pause automatically under `prefers-reduced-motion`.
7. **Case-study/portfolio hover previews** — hovering a portfolio thumbnail shows a short looped clip or a second screenshot (desktop/mobile view swap). On mobile, swap to a simple tap-to-expand instead of hover.
8. **Staggered text reveal on hero headline** — words or lines fading/sliding in with a slight delay between them on page load. One-time only, keep under ~1 second total so it never feels like it's making the visitor wait.

**Low priority / use sparingly, if at all**

9. **Cursor-follow or magnetic buttons** (button subtly pulls toward cursor) — nice on CreativeWeb but desktop-only by nature and adds real dev complexity for a mostly-mobile audience. Fine as a small flourish on 1-2 primary CTAs on desktop, not worth building broadly.
10. **WebGL/Lottie background effects** (blobs, particle fields, animated gradients) — these are what make CreativeWeb's site feel "award-winning" but they're heavy, slow to build well, and risk hurting load speed and battery life on the older/budget phones a chunk of your audience will be using. If you want one, keep it to a single small Lottie icon animation (e.g. an animated checkmark in the process section) rather than a full WebGL hero — same premium signal, tiny fraction of the cost and risk.
11. **Full-video hero background** — looks great on Marino, but production cost and page weight are real; a well-shot photo + a subtle Ken Burns zoom/pan gets ~80% of the effect for ~5% of the cost and load time. Revisit this once the agency has budget/case studies worth filming.

---

## Structural sections to combine with the above

(Carried over from earlier research — Tradely and Trusted Trade Design for structure/positioning fit, Marino/CreativeWeb for motion polish.)

- Hero: headline + founder photo/face + primary CTA (call/WhatsApp), staggered text reveal (#8), smart sticky header (#4) from first scroll.
- Trust bar: review score/count, sectors served, marquee strip (#6).
- Portfolio: 3-4 real finished sites, hover/tap preview (#7), scroll reveal (#1).
- Process: 3-4 step breakdown (Tradely/Trusted Trade Design pattern), animated step icons in, scroll reveal.
- Stats: animated counters (#3) — businesses helped, avg turnaround, reviews.
- Pricing: packages from `pricing.md`, cards with hover lift (#2).
- FAQ: accordion, gentle expand/collapse animation.
- Footer: standard, no animation needed.

---

## Implementation notes for the build (Claude Code)

- Lightweight stack suggestion: CSS transitions + Intersection Observer for reveals/hover states (no library needed); Lenis (or equivalent, ~sub-10kb) only if smooth scroll is wanted; a single small Lottie file only if a micro-interaction is wanted — avoid full animation frameworks (GSAP, Framer Motion) unless the build is React-based and the bundle cost is already accounted for.
- Wrap every animation in a `prefers-reduced-motion: reduce` media query fallback (instant show, no motion).
- Test all hover-dependent effects on a real touch device before shipping — hover-only interactions that hide content are an accessibility and mobile-usability problem.
- Keep hero load weight in mind first — this audience is judging trustworthiness in the first 2-3 seconds on a phone; a slow-loading "impressive" hero will lose more enquiries than it wins.
- All colours, type sizes and spacing pull from `laara-brand-tokens.css` / `.json` — motion should sit on top of the token system, not introduce new one-off colours or fonts.
