# Laara Digital — Brand Asset Pack

Everything you need to put the logo anywhere: web, social, print, favicons. Built from the final "Full Stop" lockup — see `10_SVG/laara-primary.svg` for the master file if you just want one thing to open.

This folder is the current, canonical version — the flat `logos/` folder that used to sit one level up has been removed since everything in it lived here now. Also one level up: `Asset Summary.png`/`.svg` (the whole system on one page), `business-card.svg`/`.png`, and `Mockups/` (the logo in real-world contexts) — none of those are duplicated in here, so check there too if you need them.

## Folder guide

| Folder | What's in it | Use it for |
|---|---|---|
| `01_Logos` | Primary lockup (laara. + DIGITAL), compact (laara. only), one-colour mono — each in ink and white, SVG + PNG | Proposals, website header, letterhead, anywhere the full brand mark is going |
| `02_Icons` | Rounded-square app icon (ink bg, paper bg, one-colour), and the bare "la." mark with no container | App icons, watermarks, anywhere a square tile is needed |
| `03_Social_Profile_Icon` | Square 1024×1024 avatar, dark and light background, mark sized to survive a circular crop | WhatsApp Business, Instagram, Facebook, Google Business Profile, LinkedIn — upload the square file as-is |
| `04_Favicons` | 16/32/48/64/192/512px PNGs, `favicon.ico` (multi-res), `apple-touch-icon.png`, `favicon-dot` (the full stop alone) | Website `<head>`, browser tab, iOS home screen icon |
| `05_Social_Covers` | Facebook Page cover (851×315), LinkedIn company banner (2256×382, built at 2x for retina), X/Twitter header (1500×500) | Cover/banner image on each platform's business page |
| `06_Web_Assets` | `og-image.png` (1200×630) — the card shown when a link to the site is shared — plus favicon.ico and apple-touch-icon again for convenience | Drop straight into the website's `<head>` meta tags |
| `07_Square` | 1080×1080 branded canvas (ink and paper) + `square-ig-grid-cover` | General square social posts. The grid-cover file is designed to pin as the *first* post in the Instagram grid — Instagram has no real cover photo, this is the standard workaround |
| `08_Portrait` | 1080×1350 (4:5) branded canvas, ink and paper | Instagram/Facebook feed posts |
| `09_Story_Reel` | 1080×1920 (9:16) branded canvas, ink and paper, logo kept clear of Instagram/TikTok's own UI overlap zones | Stories, Reels, TikTok |
| `10_SVG` | Every master vector file from every folder above, flattened into one place | Hand to a designer/developer who just wants the source files |
| `11_Favicon_32px_Simplified` | The full-stop dot on its own, rendered directly at 16px and 32px | Use this instead of the full "la." icon if the standard favicon ever looks muddy at actual browser-tab size |
| `12_EPS` | Vector EPS versions of the core logo set (primary, compact, mono, icons, mark) | Print vendors, signage, embroidery — anyone asking for "vector artwork" who doesn't want a PDF or AI file |
| `13_Instagram_Highlights` | 6 Story Highlight cover icons — Work (W), Pricing (£), Process (P), Reviews (★), FAQs (?), Contact (@) — built 1080×1920 with content kept inside Instagram's circular-crop safe zone | The row of circles under an Instagram bio. Rename/reorder to match whatever highlights you actually create; swap the symbol if a category doesn't fit |

## Colours

| | Hex |
|---|---|
| Ink | `#101114` |
| Green (accent) | `#12B76A` |
| Paper | `#FAFAF9` |

## Notes on what's *not* here

- **Van/shopfront signage** — left out at your request; ask if you want that added later.
- **YouTube/TikTok channel art, WhatsApp Business catalogue images** — not included; say the word if you want these too, same system extends easily.

## Two things still open (carried over from the logo sign-off)

- [ ] Green swatch hasn't been checked against a physical print proof — screen green and print green can drift, worth a test print before it goes on anything physical (cards, signage, vinyl).
- [ ] Trademark/Companies House name check on "Laara" / "Laara Digital" — still not done as far as I know.

## A technical note, in case you ever hand this to another designer

The `DIGITAL` tagline under the wordmark is deliberately sliced into three strips — that's a design choice, not a rendering bug. If anyone regenerates these files from source and DIGITAL comes out as solid, unsliced text, they're using a tool that doesn't support the technique used to build it; the files in this pack are all correct and were spot-checked at final resolution, including the EPS files (which needed a different build approach than the PNG/SVG — the slicing is baked into real path geometry rather than relying on a clip mask, specifically so it survives EPS/PDF conversion).
