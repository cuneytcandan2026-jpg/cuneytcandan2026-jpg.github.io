# Creative — Style Reference Capture

Raw computed/cascade styles captured from browser DevTools for a hero section (source: `cbwebsitedesign.co.uk` — see the `@font-face` `src` URL below). Tailwind + WordPress block-editor presets stack, with a full-bleed canvas hero background. Kept for inspiration only — **not** LAARA's design system. Cross-check anything reused here against `brand/laara-brand-tokens.css` and the brand guidelines before applying.

```css
element.style {
}
.hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
}
canvas, iframe, img, object, svg, video {
    display: block;
    vertical-align: middle;
}
* {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}
*, ::after, ::before {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
    border-color: currentColor;
}
*, ::after, ::before {
    /* Tailwind preflight custom-property reset — repeats identically on every
       matched selector below because DevTools lists each rule occurrence,
       not because the source duplicates it. Collapsed here; see note below. */
    --tw-border-spacing-x: 0;
    --tw-border-spacing-y: 0;
    --tw-translate-x: 0;
    --tw-translate-y: 0;
    --tw-rotate: 0;
    --tw-skew-x: 0;
    --tw-skew-y: 0;
    --tw-scale-x: 1;
    --tw-scale-y: 1;
    --tw-pan-x: ;
    --tw-pan-y: ;
    --tw-pinch-zoom: ;
    --tw-scroll-snap-strictness: proximity;
    --tw-gradient-from-position: ;
    --tw-gradient-via-position: ;
    --tw-gradient-to-position: ;
    --tw-ordinal: ;
    --tw-slashed-zero: ;
    --tw-numeric-figure: ;
    --tw-numeric-spacing: ;
    --tw-numeric-fraction: ;
    --tw-ring-inset: ;
    --tw-ring-offset-width: 0px;
    --tw-ring-offset-color: #fff;
    --tw-ring-color: rgba(59, 130, 246, .5);
    --tw-ring-offset-shadow: 0 0 #0000;
    --tw-ring-shadow: 0 0 #0000;
    --tw-shadow: 0 0 #0000;
    --tw-shadow-colored: 0 0 #0000;
    --tw-blur: ;
    --tw-brightness: ;
    --tw-contrast: ;
    --tw-grayscale: ;
    --tw-hue-rotate: ;
    --tw-invert: ;
    --tw-saturate: ;
    --tw-sepia: ;
    --tw-drop-shadow: ;
    --tw-backdrop-blur: ;
    --tw-backdrop-brightness: ;
    --tw-backdrop-contrast: ;
    --tw-backdrop-grayscale: ;
    --tw-backdrop-hue-rotate: ;
    --tw-backdrop-invert: ;
    --tw-backdrop-opacity: ;
    --tw-backdrop-saturate: ;
    --tw-backdrop-sepia: ;
    --tw-contain-size: ;
    --tw-contain-layout: ;
    --tw-contain-paint: ;
    /* ...1 more property truncated in source capture */
}
canvas[Attributes Style] {
    aspect-ratio: auto 1075 / 988;
    aspect-ratio: auto 1075 / 988;
}

/* user agent stylesheet */
canvas {
    overflow-clip-margin: content-box;
    overflow: clip;
}

/* --- Tailwind preflight reset repeats (identical block as above) applied
       across *, ::after, ::before, ::backdrop selectors — omitted here for
       brevity, see the collapsed block above for the full property list --- */

@media (min-width: 576px) and (max-width: 991px) {
    body {
        font-size: 15px;
    }
}
body {
    color: #000;
    background-color: #fafafa;
    font-family: Matter-TRIAL, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-weight: 400;
    line-height: 1.5;
    overflow-x: hidden;
    position: relative;
}
body {
    margin: 0;
    line-height: inherit;
}

:root {
    --default-color-blue: #67C0ED;
    --default-color-red: #CF3C3C;
    --default-color-yellow: #FCD111;
    --default-color-green: #46C63A;
    --default-color-purple: #880BC2;
    --default-color-neutrals: #CEB18D;
    --default-color-grey: #9A9A9A;
    --default-color-pink: #F2ACEB;
    --default-color-orange: #E79912;
    --default-color-black: #000;
    --default-color-white: #fff;
}
@media (min-width: 767px) {
    :root {
        --swiper-pagination-bottom: max(3rem, 3vw);
    }
}
:root {
    --swiper-pagination-bottom: 0;
    --swiper-pagination-bullet-size: 21.599px;
    --swiper-pagination-bullet-size: 1.2rem;
    --swiper-pagination-bullet-inactive-color: #fff;
    --swiper-pagination-color: #AC0BD9;
    --swiper-pagination-bullet-inactive-opacity: 1;
    --swiper-pagination-bullet-horizontal-gap: 18px;
    --swiper-pagination-bullet-horizontal-gap: 1rem;
    --border-round: 13.5px;
    --border-round: 0.75rem;
    --cbd-gradient: linear-gradient(60deg, #fe802d, #fe0048, #ac0bd9);
}
:root {
    --color-black: #151717;
    --color-white: #FAFAFA;
    --color-transparent: transparent;
    --color-current: currentColor;
    --color-gray-light: #D9D9D9;
    --color-gray: #9d9d9b;
    --color-gray-dark: #15231D;
    --color-orange: #FE802D;
    --color-purple: #AC0BD9;
    --color-red: #FE0048;
    --color-whiter: #FFF;
}
:root {
    --swiper-theme-color: #007aff;
}
:root {
    --wp--preset--aspect-ratio--square: 1;
    --wp--preset--aspect-ratio--4-3: 4 / 3;
    --wp--preset--aspect-ratio--3-4: 3 / 4;
    --wp--preset--aspect-ratio--3-2: 3 / 2;
    --wp--preset--aspect-ratio--2-3: 2 / 3;
    --wp--preset--aspect-ratio--16-9: 16 / 9;
    --wp--preset--aspect-ratio--9-16: 9 / 16;
    --wp--preset--color--black: #000000;
    --wp--preset--color--cyan-bluish-gray: #abb8c3;
    --wp--preset--color--white: #ffffff;
    --wp--preset--color--pale-pink: #f78da7;
    --wp--preset--color--vivid-red: #cf2e2e;
    --wp--preset--color--luminous-vivid-orange: #ff6900;
    --wp--preset--color--luminous-vivid-amber: #fcb900;
    --wp--preset--color--light-green-cyan: #7bdcb5;
    --wp--preset--color--vivid-green-cyan: #00d084;
    --wp--preset--color--pale-cyan-blue: #8ed1fc;
    --wp--preset--color--vivid-cyan-blue: #0693e3;
    --wp--preset--color--vivid-purple: #9b51e0;
    --wp--preset--gradient--vivid-cyan-blue-to-vivid-purple: linear-gradient(135deg, rgba(6, 147, 227, 1) 0%, rgb(155, 81, 224) 100%);
    --wp--preset--gradient--light-green-cyan-to-vivid-green-cyan: linear-gradient(135deg, rgb(122, 220, 180) 0%, rgb(0, 208, 130) 100%);
    --wp--preset--gradient--luminous-vivid-amber-to-luminous-vivid-orange: linear-gradient(135deg, rgba(252, 185, 0, 1) 0%, rgba(255, 105, 0, 1) 100%);
    --wp--preset--gradient--luminous-vivid-orange-to-vivid-red: linear-gradient(135deg, rgba(255, 105, 0, 1) 0%, rgb(207, 46, 46) 100%);
    --wp--preset--gradient--very-light-gray-to-cyan-bluish-gray: linear-gradient(135deg, rgb(238, 238, 238) 0%, rgb(169, 184, 195) 100%);
    --wp--preset--gradient--cool-to-warm-spectrum: linear-gradient(135deg, rgb(74, 234, 220) 0%, rgb(151, 120, 209) 20%, rgb(207, 42, 186) 40%, rgb(238, 44, 130) 60%, rgb(251, 105, 98) 80%, rgb(254, 248, 76) 100%);
    --wp--preset--gradient--blush-light-purple: linear-gradient(135deg, rgb(255, 206, 236) 0%, rgb(152, 150, 240) 100%);
    --wp--preset--gradient--blush-bordeaux: linear-gradient(135deg, rgb(254, 205, 165) 0%, rgb(254, 45, 45) 50%, rgb(107, 0, 62) 100%);
    --wp--preset--gradient--luminous-dusk: linear-gradient(135deg, rgb(255, 203, 112) 0%, rgb(199, 81, 192) 50%, rgb(65, 88, 208) 100%);
    --wp--preset--gradient--pale-ocean: linear-gradient(135deg, rgb(255, 245, 203) 0%, rgb(182, 227, 212) 50%, rgb(51, 167, 181) 100%);
    --wp--preset--gradient--electric-grass: linear-gradient(135deg, rgb(202, 248, 128) 0%, rgb(113, 206, 126) 100%);
    --wp--preset--gradient--midnight: linear-gradient(135deg, rgb(2, 3, 129) 0%, rgb(40, 116, 252) 100%);
    --wp--preset--font-size--small: 13px;
    --wp--preset--font-size--medium: 20px;
    --wp--preset--font-size--large: 36px;
    --wp--preset--font-size--x-large: 42px;
    --wp--preset--spacing--20: 0.44rem;
    --wp--preset--spacing--30: 0.67rem;
    --wp--preset--spacing--40: 1rem;
    --wp--preset--spacing--50: 1.5rem;
    --wp--preset--spacing--60: 2.25rem;
    --wp--preset--spacing--70: 3.38rem;
    --wp--preset--spacing--80: 5.06rem;
    --wp--preset--shadow--natural: 6px 6px 9px rgba(0, 0, 0, .2);
    --wp--preset--shadow--deep: 12px 12px 50px rgba(0, 0, 0, .4);
    --wp--preset--shadow--sharp: 6px 6px 0px rgba(0, 0, 0, .2);
    --wp--preset--shadow--outlined: 6px 6px 0px -3px rgba(255, 255, 255, 1), 6px 6px rgba(0, 0, 0, 1);
    --wp--preset--shadow--crisp: 6px 6px 0px rgba(0, 0, 0, 1);
}
:root {
    --wp--preset--font-size--normal: 16px;
    --wp--preset--font-size--huge: 42px;
}
html {
    font-size: 18px;
}
html {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;
    font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    font-feature-settings: normal;
    font-variation-settings: normal;
    -webkit-tap-highlight-color: transparent;
}
html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
}
::after, ::before {
    --tw-content: '';
}
::selection {
    background-color: rgba(0, 0, 0, .99);
    color: #fff;
}

<style>
@font-face {
    font-family: Matter-TRIAL;
    src: url(https://www.cbwebsitedesign.co.uk/wp-content/themes/cbd/fonts/Matter-TRIAL-Bold.woff2) format('woff2'), url(https://www.cbwebsitedesign.co.uk/wp-content/themes/cbd/fonts/Matter-TRIAL-Bold.woff) format('woff');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
    /* ...capture cut off mid @font-face block in source paste */
```

## Notable patterns worth noting

- **Full-bleed canvas hero** — `.hero-bg { position: absolute; top:0; left:0; width:100vw; height:100vh; }` layered behind content, with a `<canvas>` sized via `aspect-ratio: auto 1075/988` inline. Points to a WebGL/interactive-canvas hero animation, not a static image — worth studying separately if LAARA wants a similar motion hero, but that's a bigger scope decision than a CSS lift.
- **Tailwind + WordPress block-editor stack** — this site runs Tailwind utility classes (`--tw-*` preflight vars) *inside* a WordPress theme that still ships the full Gutenberg preset token set (`--wp--preset--*` colors/gradients/spacing/shadows/font-sizes). Two design systems coexisting; only the site's own `--color-*` and `--default-color-*` custom palette (defined separately) is actually driving its visible design — the WP presets look unused/vestigial here.
- **`Matter-TRIAL` webfont** — the font family name and filename (`Matter-TRIAL-Bold.woff2`) indicate a **trial/unlicensed** commercial font. Not usable for LAARA even as a lookalike reference without checking licensing — LAARA's typography is locked to Lato per `brand/laara-brand-tokens.css` and CLAUDE.md regardless.
- **Custom `::selection` styling** — black background (`rgba(0,0,0,.99)`) with white text on text selection, a small polish detail that's cheap to replicate if desired (respecting LAARA's ink/paper palette instead).
- **Source site**: `cbwebsitedesign.co.uk` (per the `@font-face` URL) — a UK web design agency site, relevant as a same-industry competitor/inspiration reference rather than a random capture.
