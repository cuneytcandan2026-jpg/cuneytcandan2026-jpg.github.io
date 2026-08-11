# Build brief — laaradigital.co.uk

**The job spec.** Standing rules — brand, contrast, accessibility, honesty, build defaults, dev workflow — are in `CLAUDE.md` at the repo root and load automatically. This file covers what's being built and in what order.

---

## The task

Build the Laara Digital agency website: a fast, friendly, trustworthy, subtly animated multi-page static site that makes a small UK business owner feel confident enough to call, WhatsApp or fill in a short form.

Smooth and alive on desktop and mobile, without ever getting in the way of that phone call.

---

## Before starting

Read `CLAUDE.md` first, then the files it lists under "Sources of truth" — at minimum `brand/laara-brand-tokens.css`, `docs/sitemap.md`, `docs/pricing.md` and `docs/laara-design-animation-brief.md`.

One thing to clear out on the first pass: **`index.html` at the repo root is a leftover experiment and is off-brand** — wrong fonts (Fraunces/Archivo), wrong palette (clay/moss), wrong positioning ("Creative & Design Studio"). Replace it entirely. Don't extend it.

---

## Homepage v2 — redo, closer to Insparation

A first version of the homepage exists (`index.html`, `assets/css/style.css`, `assets/js/main.js`, checked into git as a checkpoint commit — diff against it if you want to see exactly what's changing). It's accurate — right colours, right copy, right prices — but generic: every section is a centred stack of white/paper cards on the same background plane, the hero headline uses the default h1 size instead of the display scale, the work section is plain cards with a link underneath instead of image-led, and the trust strip is a static 6-icon grid. It reads like a template, not like an agency selling its own design taste.

**Rebuild it.** Keep the content — copy, prices, portfolio facts, sector list are all still correct and sourced from `docs/services.md`, `docs/pricing.md` and `docs/portfolio.md`. Redo the visual and structural execution to sit much closer to `Insparation/marino/marino.png` and `Insparation/cbwebsitedesign/cbwebsitedesign.png`.

Specifically, borrow from Insparation:

- **Alternating light/dark full-bleed sections.** v1 puts almost everything on paper/white. Use `--laara-bg-inverse` for at least one section — a process break or a stat section works well, both reference sites do this.
- **Oversized display typography.** Use `--laara-fs-display` for the hero headline and section breaks instead of defaulting to h1/h2 sizes everywhere. Marino's hero headline dominates the fold; v1's doesn't.
- **An editorial work grid.** Each portfolio card gets a strong image with a dark gradient overlay and small pill/tag labels (sector, service type) sitting over the image — not a white card with a caption underneath. `node screenshot.mjs <url>` against the sites in `docs/portfolio.md` for the source images.
- **A moving trust strip.** Sectors served as a slow marquee (already scoped as medium-priority in `docs/laara-design-animation-brief.md`), not a static icon grid.
- **Confident asymmetry.** Image and text side-by-side or offset in places, not everything centred and uniformly stacked.

What doesn't change: the brand tokens (colour, contrast pairings, Lato, logo files), the pricing figures, the service names, the honest-proof numbers below, accessibility floors, and the four priority animations — `main.js` already implements scroll reveals, animated counters and the smart sticky header reasonably well; keep that logic and build the new visual design on top of it rather than starting the JS from scratch. Card/button hover-lift micro-interactions weren't clearly present in v1 — add those this pass.

---

## Build order

Don't build all 10 pages at once. Get the homepage right, then templatise.

**Phase 1 — Home + Contact.** The conversion core. Nothing else matters if this doesn't work on a phone. This is the v2 redo above.

Section order (this part of v1 was already right, keep it):

1. Hero — the promise, one sentence, primary CTA, trust line
2. Trust strip — sectors served
3. Services — outcome-led, linking to the 5 service pages
4. Selected work — real screenshots, real context
5. Pricing teaser — three tiers with "from" prices, linking to Pricing
6. Process — 3-step (call → build → launch)
7. Proof — see "Honest proof" below
8. Final CTA — quote, call, or WhatsApp

**Phase 2 — Pricing + the 5 service pages.** Build one service page properly, get it approved, then apply the pattern to the other four.

**Phase 3 — Work + About.** Build Work from `docs/portfolio.md`. About needs Cuneyt's real photo and story — leave a clearly-marked placeholder if it isn't supplied yet.

**Phase 4 — Sector pages.** Footer-linked, not in the header nav (see `docs/sitemap.md`). Highest-return SEO play for this business, but only after the core site is live.

---

## Motion

`docs/laara-design-animation-brief.md` has the full prioritised list. Build these four first and stop there until they're smooth:

1. **Scroll reveals** — IntersectionObserver, opacity + translateY, ~280ms, 16–24px travel
2. **Card and button micro-interactions** — lift, shadow, colour shift
3. **Animated counters** — only with the honest numbers below
4. **Smart sticky header** — hides on scroll down, returns on scroll up, phone/WhatsApp always reachable

Skip the low-priority items (WebGL hero, cursor-follow, video background) for v1. The brief's own reasoning applies: heavy, slow, and aimed at a desktop audience this site doesn't have.

---

## Honest proof — read before writing any number

No testimonials, no Google reviews, no measured client results exist yet. Anything in a proof slot must be defensible today.

**Safe to state:**

- 6 websites built across 4 sectors
- Live in 7–10 days (Essential)
- Fixed pricing from £797
- 11+ years in CRM and customer marketing before founding Laara Digital
- Named priority sectors served

**Do not state, in any form:**

- "40+ businesses helped" — this appears as an example in the animation brief. It is illustrative, not real. Do not ship it.
- Any star rating, review count, revenue figure, ranking improvement or conversion percentage
- Any testimonial

Build the testimonial section markup so it's ready, then leave it out of the page until Cuneyt supplies real, attributed quotes (full name, business, town).

---

## Images

`npm run generate-image "<prompt>" <filename.png>` → `assets/img/`.

**Generate with AI:**

- Sector context photography for sector pages and homepage sector cards — a plumber at work, a salon interior, a barber's chair
- Abstract textures and gradient backgrounds
- Process step illustrations

Prompt in the brand palette (ink `#101114`, green `#12B76A`, paper `#FAFAF9`), realistic UK settings, natural light. Alt text describes what's shown and never implies a client.

**Never generate with AI:**

| Asset | Use instead |
|---|---|
| Cuneyt's founder photo | A real photograph. A real photo of the founder is a core trust element for this audience — an AI face is the fastest way to lose exactly the trust this site is built to earn. |
| Portfolio thumbnails | `node screenshot.mjs <live-url>` against the 6 URLs in `docs/portfolio.md` |
| Any face presented as a client, customer or reviewer | Nothing. Don't create these. |
| Logo, icons, favicons, OG image | `brand_assets/00_Upload_Ready/` — already produced |

**Video:** not wired up in this repo, and the animation brief rates a video hero low priority. Use its suggested alternative — a good still with a subtle Ken Burns pan. Revisit when there's real client footage worth shooting.

---

## Definition of done — Phase 1

Home and Contact live locally, verified at 1440px and 390px, every item on the `CLAUDE.md` checklist passing, motion smooth on mobile — and a stranger landing on the homepage on a phone understands what Laara does, what it costs and how to make contact in under ten seconds, without scrolling past a single fabricated claim.

---

## Open decisions — ask Cuneyt, don't assume

1. **Founder photo** — is a real photo available? Blocks the About page and the hero trust element.
2. **Contact form backend** — Formspree, Netlify Forms, or email only for now?
3. **Hosting** — Hostinger already runs the domain and email. Same for the site?

Record the answers here as they're decided.
