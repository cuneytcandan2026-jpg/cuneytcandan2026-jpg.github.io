---
Build-ready brief for the Work/Portfolio page. Site inventory and status are sourced from `Launch-Tracker.md` Phase 4 — that file is the source of truth for progress and dates, this file organises it for a build task. Page spec is `LAARA_Digital_Brand_Guidelines_v3.md` §17 (Website Content Architecture). Brand voice and disclosure rules are in `CLAUDE.md`. All six live URLs below were fetched and confirmed working on 2026-08-11 — re-check before relying on this if it's been a while.
---

# Portfolio — Laara Digital

Last link-checked: 2026-08-11 (all 6 live URLs returned working pages).

## 1. Portfolio sites

| Site | Sector | Type | Location | URL | Status | Case study rule |
|---|---|---|---|---|---|---|
| Ooh La La Brasserie | Food (café/brasserie) | Real client | Enfield, North London | https://www.oohlalabrasserie.com/ | Live, verified ✅ | No measured-result case study yet — no enquiry/booking data collected. Testimonial/review request not yet sent. |
| N10 Academy | Fitness (youth football academy) | Real client | Edmonton, North London | https://www.n10academy.co.uk/ | Live, verified ✅ | Same — no real-number case study yet. Footer currently carries no Laara Digital credit at all. |
| Café site 3 | Food | Real client | — | Not live yet | In progress — blocked on client sign-off | N/A until live |
| Fade & Co. | Hair & beauty (barber) | Concept demo (fictional) | Manchester, Northern Quarter | https://barber.laaradigital.co.uk | Live, verified ✅ | Design-intent framing only, never a measured result. Self-discloses as fictional on-page. |
| Bloom Hair & Beauty | Hair & beauty (salon) | Concept demo (fictional) | Harrogate | https://salon.laaradigital.co.uk | Live, verified ✅ | Same |
| Harris Plumbing & Heating | Trades | Concept demo (fictional) | Enfield / North London | https://trades.laaradigital.co.uk | Live, verified ✅ | Same |
| Ember Fitness | Fitness | Concept demo (fictional, bonus — not in original Phase 4 plan) | Shoreditch, London | https://fitness.laaradigital.co.uk | Live, verified ✅ | Same |

## 2. Sector coverage

Checked against the priority sector list in `positioning-usp.md`:

| Sector | Covered by |
|---|---|
| Trades | Harris Plumbing & Heating |
| Hair & beauty | Fade & Co. (barber), Bloom Hair & Beauty (salon) |
| Food | Ooh La La Brasserie |
| Cleaning & removals | **No site yet** |
| Fitness | N10 Academy, Ember Fitness |
| Garages & MOT | **No site yet** |

Gap: no portfolio proof for Cleaning & removals or Garages & MOT. Worth flagging as the next demo build once bandwidth allows — not urgent for the initial Work page.

## 3. Findings from the live link check (2026-08-11)

- All 6 URLs resolve and serve the expected page — no broken links.
- All 4 concept-demo footers currently read "Concept demo by **LAARA** Digital" — old all-caps casing, retired under v3 (`CLAUDE.md`: "Never write LAARA in all caps"). This is already tracked as a to-do in `Launch-Tracker.md` Phase 7, intentionally held until laaradigital.co.uk is live so the credit can link somewhere — don't fix in isolation, fix in the same pass as the other Phase 7 footer items.
- Neither real client site (Ooh La La Brasserie, N10 Academy) currently shows a Laara Digital credit anywhere — confirms the "unknown, verify" note in Launch-Tracker Phase 7 as fact: there is nothing there yet, and nothing should be added without asking the client first.
- Ember Fitness shows "£0/month" on all three membership tiers, and "0" across all four stats in the "Why Ember" section, in the raw page. This is very likely a JS count-up animation that renders correctly with real numbers in a browser — a static fetch can't execute that script — but worth a 30-second visual check in a real browser before relying on this page for a client demo or a walkthrough.

## 4. Disclosure and credit rules — don't get this wrong

- **Real client sites**: ask before adding any Laara Digital credit or link — it's their property, not a demo. Building the Work page does not require editing either site.
- **Concept demo sites**: must keep the existing fictional-business disclosure in the footer. Don't remove it while updating anything else.
- **Never fabricate a client result** (`CLAUDE.md` voice rule). None of the four demo businesses have real customers or data — case studies for them describe the design problem and intended outcome, never a number.
- Save outcome-based, real-number case studies for Ooh La La Brasserie and N10 Academy once there's actual enquiry or booking data to report.

## 5. Building the Work/Portfolio page — task brief

Per brand guidelines §17, the Work page's job is to "provide credible evidence: before/after, case studies, results, client context."

1. Re-verify each URL above still resolves before publishing links to it.
2. Write one case study per live site, following the framing rule in the table above — real clients get problem/context only until real data exists; demos get design-intent framing only.
3. Where a demo site has its own "before/after" or "transformations" section (Bloom and Ember both do, built from AI concept imagery), don't present that content as evidence of a real Laara Digital result — it's the fictional client's own placeholder content, not proof of an outcome delivered.
4. Structure the page per §17: before/after, case studies, results, client context.
5. Link out to each live site.
6. Leave café site 3 off the initial build — add once it has a URL and client sign-off.
7. Don't touch footer credits on any of the 6 sites as part of this task — that's the separate, already-blocked Phase 7 item.
