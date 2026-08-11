---
Sitemap and navigation brief for the laaradigital.co.uk build (Phase 7). Requested pattern: https://oxdpr.com/ — Services mega-menu dropdown to separate pages, standalone Portfolio, standalone About. The dropdown *structure* is borrowed from that reference; the *service names inside it are Laara's own only* (§3) — none of OxD's categories (Branding, Photography, Videography, Web Hosting, App Development, Email Marketing, Business) apply here. Reconciles that pattern with the existing page spec in `LAARA_Digital_Brand_Guidelines_v3.md` §16-17, the service groupings in `services.md`, the site list in `portfolio.md`, and the pricing-visibility decision made in chat on 2026-08-11 (show "from £X" — don't go quote-only). Feeds Phase 7 of `Launch-Tracker.md`.
---

# Sitemap & Navigation — Laara Digital

## 1. What oxdpr.com actually does (reference, checked 2026-08-11)

**Structure only — not the service list.** The service names in the table below (Marketing, Branding, Photography, Videography, Business, Web Hosting, App Development, Email Marketing) are OxD's own offer, a broader multi-discipline marketing agency. Laara doesn't provide any of these. Only borrow the *pattern* — a dropdown linking to separate pages. The actual page names to build are in §3, sourced entirely from `services.md` and `pricing.md`.

| Element | Their pattern |
|---|---|
| Services | Header mega-menu — 10 individual service pages (Web Design, SEO, Marketing, Branding, Photography, Videography, Business, Web Hosting, App Development, Email Marketing), each with its own URL |
| Portfolio | Standalone "ePortfolio" page — a filterable grid of 10+ case studies, each tagged by category (SEO, Branding, Website Design, etc.), each with a short problem/context blurb and a "Read More" link to its own full case-study page |
| About | Standalone page, single nav item |
| Pricing | **Not in the nav at all.** No prices shown anywhere — "Get a Quote" is the only commercial CTA, backed by 24-month contracts disclosed only in the FAQ |
| Location pages | 14 city pages (Bristol, Manchester, Glasgow, etc.) — but these live in the **footer only**, not the header nav |
| Extra nav items | Knowledge Base (blog), persistent "Get a Quote" button separate from the nav links |

Two things worth flagging before copying this wholesale:

- **Pricing.** OxD hides it entirely and gates everything behind a quote. That's the opposite of what we agreed for Laara — "from £797" visible is a deliberate trust signal for this buyer (see chat, 2026-08-11: hiding price costs more enquiries than it protects for a plumber who's been burned before). Keep Pricing as its own nav item; don't drop it chasing this reference.
- **Location pages, footer-only.** This is actually a useful precedent, not a gap. It confirms the existing §17 guidance — separate landing pages outperform folding everything into one page — while showing they don't need header nav space to work. Laara's sector pages can follow the same placement (see §4 below).

## 2. Recommended top-level navigation

| Item | Type | Notes |
|---|---|---|
| Services | Dropdown → 5 pages | See §3 |
| Work | Single page | Portfolio grid + inline case studies — see §4 |
| Pricing | Single page | Three packages + care plans, per §17. Keep visible. |
| About | Single page | Story, approach, why local businesses, founder — per §17, unchanged |
| Contact | Single page/anchor | Short form, phone, WhatsApp, response time |

5 items — matches the guidelines §16 nav rule ("5–6 top-level items maximum"). Sector pages are deliberately left out of this list — see §4.

## 3. Services dropdown — 5 pages

**This is the only services list to build.** Laara's own confirmed services, pulled directly from the outcome-based grouping already recommended in `services.md` §4 (itself sourced from `pricing.md`), now spec'd as real pages instead of sections on one page. Do not add OxD's categories from §1 — Laara doesn't sell Branding, Photography, Videography, Web Hosting, App Development, Email Marketing or general "Business" services, and nothing in the source-of-truth files supports adding them:

| Page | Suggested slug | Covers |
|---|---|---|
| Website Design & Build | `/services/website-design` | Essential / Professional / Growth packages |
| Local SEO & Google Visibility | `/services/local-seo` | On-page SEO, GBP setup/management, schema markup |
| Booking & Enquiry Systems | `/services/booking-systems` | Booking/enquiry systems included in Professional/Growth, standalone add-on for Essential |
| Ongoing Care & Support | `/services/care-plans` | Maintain / Grow / Market retainers |
| Growth & Paid Ads | `/services/growth-ads` | Google/Meta Ads management (Market tier), competitor analysis, landing pages |

Five pages, not oxdpr.com's ten — Laara is a focused offer, not a multi-discipline agency, and the guidelines' own principle applies here too: read every page as if you're a busy plumber on a phone with one bar of signal. A ten-item mega-menu works for a broad marketing agency; it would bury the offer for this audience.

## 4. Portfolio ("Work") page — start simpler than oxdpr.com's ePortfolio

OxD's ePortfolio is a filterable grid with a dedicated URL per case study — that structure earns its keep at 10+ live projects. Laara currently has 7 tracked in `portfolio.md` (2 real, 1 in progress, 4 concept demos). Building a full one-page-per-case-study system now is over-engineering for the current portfolio size.

**Recommended for now:** one Work page, structured per guidelines §17 ("before/after, case studies, results, client context") — a card grid where each card expands to (or scrolls to) an inline case study block. No separate URL per project yet.

**Revisit once the portfolio grows past ~10 real projects** — that's the point OxD's individual-case-study-page pattern starts paying for itself in internal linking and SEO. Note it here so it isn't forgotten, not because it's needed today.

Site list, case-study framing rules (real client vs. concept demo) and sector coverage all already live in `portfolio.md` — this page should be built from that file directly.

## 5. Sector pages — footer, not header nav

Guidelines §17 is explicit that sector pages ("website design for plumbers in [town]") are the highest-return SEO play and should exist as their own pages. OxD's own site backs this up structurally with its 14 city pages — but notably keeps them **out of the header nav**, in the footer only, so they don't compete for header space or overwhelm a first-time visitor.

Recommend the same for Laara:

- Don't give sector pages a second header dropdown yet (would push nav to 6 items and add complexity before there's content to justify it).
- Link sector pages from the footer, from homepage sector-specific cards/sections, and from ads/Google — exactly where they'll actually be found by someone searching.
- Revisit a dedicated "Industries" header dropdown once 3+ sector pages exist and you can see whether people are navigating to them directly vs. arriving from search.

## 6. Full sitemap

```
Home
├─ Services ▾
│  ├─ Website Design & Build
│  ├─ Local SEO & Google Visibility
│  ├─ Booking & Enquiry Systems
│  ├─ Ongoing Care & Support
│  └─ Growth & Paid Ads
├─ Work
├─ Pricing
├─ About
└─ Contact

Footer (not in header nav)
├─ Sector pages — one per priority sector as built (Trades, Hair & beauty, Food, Cleaning & removals, Fitness, Garages & MOT)
├─ Terms / Privacy
└─ Social links
```

## 7. Open decisions for Cuneyt

- Confirm the 5 service page names/slugs above, or adjust groupings.
- Confirm sector pages stay footer-only for launch (recommended) rather than getting their own nav dropdown.
- Confirm URL slug convention (`/services/...` used above) before Claude Code starts building routes.
