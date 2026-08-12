# CLAUDE.md — laaradigital.co.uk

Frontend repo for the Laara Digital agency website. Founder: Cuneyt Candan, London.

Audience: small UK business owners — plumbers, barbers, salon and restaurant owners. Older-skewing, mostly on a phone, often burned before by a bad web quote. Every rule below exists to serve that person.

**The site is built out across the full sitemap** — Home, About, Contact, Pricing, Work, 5 service pages, 6 sector pages, plus `robots.txt` and `sitemap.xml`. See "Site structure & key systems" below. `docs/BUILD-PROMPT.md` is the original phased build brief (page order, the v1→v2 homepage redo, image-generation rules, the honest-proof number list) — phases 1–4 are done, so treat it as build history and standing rules (image sourcing, honest-proof numbers) rather than a live task list. It still tracks two open decisions worth checking before assuming: the founder photo (still a placeholder on About) and hosting. The contact-form-backend decision it also lists is resolved — Web3Forms, wired up in `assets/js/contact-wizard.js`.

**The full brand guidelines doc is paused as a build reference — it isn't even in this repo right now, and that's deliberate.** Cuneyt is revising it, and building strictly to it produced an accurate but generic v1 homepage: flat white cards, no bold type scale, no dark sections, nothing that looked like an agency worth hiring for its own design taste. Don't go looking for it or rebuild it from memory. The parts of it that are non-negotiable regardless of any future revision — colour, contrast, type scale, spacing, motion timing, logo rules — are already encoded in `brand/laara-brand-tokens.css`. Build from that file. For look and feel, `Insparation/` is the primary reference.

---

## Sources of truth — never invent these

| Topic | File |
|---|---|
| **Design system — the hard constraints.** Colours, contrast pairings, type scale, spacing, motion timing, ready-made `.laara-btn`/`.laara-card`/`.laara-input` components | `brand/laara-brand-tokens.css` / `.json` |
| **Every price on the site** | `docs/pricing.md` |
| Page structure, nav, slugs | `docs/sitemap.md` |
| What each service page covers | `docs/services.md` |
| Messaging, sector language | `docs/positioning-usp.md` |
| Portfolio sites + per-site description rules | `docs/portfolio.md` |
| Motion concepts, prioritised | `docs/laara-design-animation-brief.md` |
| Logos, icons, favicons, OG image | `brand_assets/00_Upload_Ready/` |

These are synced copies. The master lives in Cuneyt's Agency Launch folder — flag drift rather than editing a price here.

**`Insparation/` is the primary visual and structural reference** — screenshots of marino.co.uk and cbwebsitedesign.co.uk, plus captured style notes in `Insparation/marino/Marino Styles.md` and `Insparation/cbwebsitedesign/Creative.md`. Study these closely: bold oversized type, alternating dark/light full-bleed sections, editorial work-grid cards with overlay tags, asymmetric layout. **Borrow structure and motion concepts only — never clone their layouts, colours, fonts or copy verbatim.** cbwebsitedesign's `Matter-TRIAL` font is an unlicensed trial font — not usable even as a close match. Laara's typeface stays Lato regardless of what's borrowed structurally.

The `.mp4` clips at the repo root (`Cards.mp4`, `Cards2.mp4`, `Section Headers.mp4`, `ContactUsForm.mp4`, `Be Creative.mp4`) are Cuneyt's own motion/interaction reference recordings — same role as `Insparation/` but for animation rather than layout. They're untracked and large (several MB up to 25MB) — don't sweep them into a commit with `git add -A`/`.`; add other files by name instead.

---

## Site structure & key systems

Full sitemap (`docs/sitemap.md` §6) — every route below is built and must stay listed in `sitemap.xml` and reachable per `robots.txt` when it changes:

- Home (`index.html`), About, Contact, Pricing, Work
- Services dropdown: `services/website-design.html`, `local-seo.html`, `booking-systems.html`, `care-plans.html`, `growth-ads.html`
- Sector pages, footer-only (not in header nav): `sectors/trades.html`, `hair-beauty.html`, `food.html`, `cleaning-removals.html`, `fitness.html`, `garages-mot.html`

Three custom JS systems carry real logic — read them before editing:

- **`assets/js/fluid-hero.js`** — WebGL hero background built on the MIT-licensed Pavel Dobryakov fluid sim (attribution comment at the top of the file — keep it). Falls back to a static CSS background on `prefers-reduced-motion`, no WebGL support, or `navigator.connection.saveData`. Check all three paths, not just the animated one.
- **`assets/js/contact-wizard.js` + `contact-wizard-config.js`** — the Contact page's quote wizard and short enquiry form. Wording and price bands live in `contact-wizard-config.js` only — edit content there, not inline. Both forms submit to Web3Forms (`api.web3forms.com`); wizard progress persists to `sessionStorage`.
- **`assets/js/pricing.js` + `pricing-data.js`** — the Pricing page's "Help Me Choose" tool. Scoring logic must stay traceable to `docs/pricing.md`; don't add a rule that isn't sourced from that file.

`_verify_heroes.mjs` is a narrower companion to `screenshot.mjs`: it loads the five inner-page heroes, fires a synthetic pointer sweep across `.hero-fluid` to trigger a visible reveal, watches for console/page errors, and clips a screenshot to just the hero box. Run it after touching `fluid-hero.js` or page-hero markup; use `screenshot.mjs` for everything else.

---

## Brand facts

| | |
|---|---|
| Name in copy | **Laara Digital** — sentence case. Never LAARA. |
| Logo | Place the SVG. Never type `laara.` as text. |
| Tagline | **None.** Lead with: *Get found online. Get more enquiries.* |
| Domain / email | laaradigital.co.uk · hello@laaradigital.co.uk |
| Ink | `#101114` |
| Green | `#12B76A` |
| Paper | `#FAFAF9` |
| Typeface | Lato (400/700/900). Archivo Black is logo artwork — never load as web type. |

### The rule that breaks things if missed

**Green `#12B76A` fails WCAG contrast on white (2.62:1).**

- Green button → **ink `#101114`** text (7.20:1). Never white.
- Green text on light → **`#0D844D`** (4.75:1). Never `#12B76A`.
- Green on ink is fine (7.20:1).
- Body-size grey → `#6E747D`. `#8A8F98` is large-text only.

Use semantic CSS variables for these pairings so it's applied consistently rather than re-checked by eye each time.

### Logo tier rule

DIGITAL only appears at 200px+. Below that use compact `laara.`; below 80px use `la.`; at favicon size use the dot. When unsure, drop a tier.

---

## Voice

Plain English. Explain SEO, CRM and CTA rather than assuming.

- British English. Short sentences. Active voice. Sentence case headings.
- Write *you/your*. Use *we* for responsibility.
- Prices as £797, £1,497, £2,497 — always "from" for entry pricing.

Say: build, improve, high-performing, practical, enquiries, bookings.
Avoid: revolutionise, disrupt, world-class, game-changing, guaranteed, cheap.

Translate per sector: "high-performing website" → "a website that makes your phone ring".

---

## Honesty rules — the ones most likely to be broken by accident

- **Never guarantee rankings, revenue or conversion rates.**
- **Never fabricate a client result, testimonial, review or statistic.**
- The 4 concept demo sites are fictional businesses. They may be shown as design work; never described as having produced a result.
- Every figure on the site must be traceable to `docs/pricing.md` or to `docs/BUILD-PROMPT.md`'s list of defensible numbers.

There are currently no testimonials, no Google reviews and no measured results. If a section needs proof and none exists, leave it out — don't fill it.

---

## Build defaults

- **Multi-page static site.** One HTML file per route in `docs/sitemap.md`, sharing one linked stylesheet built on `brand/laara-brand-tokens.css`. Do not inline styles per page.
- **Plain CSS on the token system.** Don't add Tailwind via CDN — it compiles in-browser, which is a large JS payload and a flash of unstyled content on exactly the mid-range phones this audience uses. If Tailwind is ever wanted, it needs a real build step.
- Mobile-first. Never hardcode a one-off hex, size or timing that should be a shared variable.
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`, only where no real asset exists.

Required `<head>` on every page — every existing page follows this pattern, match it exactly for new ones:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Page Title — Laara Digital</title>
<meta name="description" content="..." />
<link rel="canonical" href="https://laaradigital.co.uk/<path>" />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://laaradigital.co.uk/<path>" />
<meta property="og:image" content="https://laaradigital.co.uk/brand_assets/00_Upload_Ready/06_Web_Assets/og-image.png" />
<meta property="og:locale" content="en_GB" />
<meta property="og:site_name" content="Laara Digital" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://laaradigital.co.uk/brand_assets/00_Upload_Ready/06_Web_Assets/og-image.png" />

<link rel="icon" href="/brand_assets/00_Upload_Ready/04_Favicons/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/brand_assets/00_Upload_Ready/04_Favicons/favicon-32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/brand_assets/00_Upload_Ready/04_Favicons/favicon-16.png" />
<link rel="apple-touch-icon" href="/brand_assets/00_Upload_Ready/04_Favicons/apple-touch-icon.png" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;600;700;900&display=swap" rel="stylesheet" />

<link rel="stylesheet" href="/brand/laara-brand-tokens.css" />
<link rel="stylesheet" href="/assets/css/style.css" />
```

Plus a page-appropriate `application/ld+json` schema block — `ProfessionalService` on the homepage, `BreadcrumbList` on inner pages (see any existing page's `<head>` for the exact shape). Add the new route to `sitemap.xml` in the same pass.

---

## Design guardrails

- **Colours:** derive from the token palette only. No default Tailwind palette (indigo-500, blue-600).
- **Typography:** Lato throughout — weight, size and tracking carry the hierarchy, not a second family. Use the full type scale in the tokens, including `--laara-fs-display` — v1 never used it and every heading ended up the same size. Tight tracking on large headings, `line-height: 1.7` on body.
- **Shadows:** layered, ink-tinted, low opacity — use `--laara-shadow-*`, never flat `shadow-md`.
- **Depth:** base → elevated → floating. Surfaces shouldn't all sit at one z-plane. v1 put almost everything on the same paper-white plane — mix in `--laara-bg-inverse` (ink) sections.
- **Animations:** `transform` and `opacity` only. No `transition-all`. Timings and easing from `--laara-dur-*` / `--laara-ease-*`.
- **Interactive states:** every clickable element needs hover, focus-visible and active. Every hover effect needs a tap-state equivalent — most traffic is touch.
- **Scroll reveals:** `IntersectionObserver` on opacity + translateY. Never trigger on page load.
- **Reduced motion:** every animation needs a `prefers-reduced-motion: reduce` path — implement it explicitly per animation, don't rely on a shared fallback.

---

## Accessibility — WCAG 2.2 AA, non-negotiable

16px minimum body text · 48px minimum controls · 44px touch targets · visible keyboard focus · one H1 per page · semantic HTML (`<nav>`, `<main>`, `<button>` — never `<div>` for clicks) · descriptive `alt` on all images · mobile-first.

For this audience accessibility is conversion work, not compliance work.

---

## Dev server

`node serve.mjs` — serves on **port 3000**. Run in background. Never screenshot `file:///`. Don't start a second instance if one is running.

## Screenshots

```
node screenshot.mjs http://localhost:3000 <label>          # desktop 1440px
node screenshot.mjs http://localhost:3000 <label> mobile   # mobile 390px
```

Saves to `./temporary-screenshots/`. Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`; `puppeteer-core` is in `node_modules/`.

**Always capture both widths every pass.** Read each PNG back with the Read tool and check it against the brief — be specific about pixel values, hex colours, spacing, radius, shadows. Minimum two comparison rounds per page.

## Images

**Never generate an image, video, or any other asset via ChatGPT/OpenAI (`npm run generate-image`) or Higgsfield without Cuneyt's explicit, per-item approval first.** Describe what you want to generate — prompt, filename, purpose — and wait for a yes before running it. This applies every time, not just once per session.

`npm run generate-image "<prompt>" <filename.png>` — OpenAI `gpt-image-2`, 1536×1024, saves to `assets/img/`. Key is in `.env`.

Never AI-generate: the founder photo, portfolio thumbnails, or any face presented as a client or reviewer. Full rules in `docs/BUILD-PROMPT.md`.

## Git

Branch is `master`. No remote configured yet. Commit locally as you go. **Never push unless Cuneyt explicitly asks.**

---

## Per-page checklist — before calling anything done

- [ ] No white text on green anywhere
- [ ] No `#12B76A` as text on a light background
- [ ] Tap targets ≥44px, controls ≥48px, body text ≥16px
- [ ] Visible keyboard focus on every interactive element
- [ ] Exactly one H1
- [ ] Every animation has a reduced-motion path
- [ ] No fabricated number, review, testimonial or result
- [ ] Every price traceable to `docs/pricing.md`
- [ ] Phone and WhatsApp reachable in the mobile header
- [ ] Desktop and mobile screenshots both reviewed
- [ ] New routes added to `sitemap.xml`, reachable per `robots.txt`, full `<head>` pattern matched
