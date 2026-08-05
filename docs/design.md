# Design System Reference

Reverse-engineered from `globals.css`, CSS Modules, and `.claude/skills/`. Where the live CSS
(`app/styles/globals.css`) and the skill docs disagree, **the live CSS wins**. Conflicts are
called out explicitly in section 19.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Character Rules](#2-character-rules)
3. [Color - Primitives](#3-color---primitives)
4. [Color - Semantics](#4-color---semantics)
5. [Dark Mode](#5-dark-mode)
6. [Typography](#6-typography)
7. [Spacing](#7-spacing)
8. [Border Radius](#8-border-radius)
9. [Shadows](#9-shadows)
10. [Motion](#10-motion)
11. [Opacity](#11-opacity)
12. [Z-Index](#12-z-index)
13. [Layout & Grid](#13-layout--grid)
14. [Icons](#14-icons)
15. [Accessibility Rules](#15-accessibility-rules)
16. [Components](#16-components)
17. [Page Rhythm](#17-page-rhythm)
18. [Brand Identity](#18-brand-identity)
19. [Presentation Rules](#19-presentation-rules)

---

## 1. Architecture

- **No Tailwind, no UI library.** Pure CSS Modules + one `globals.css`.
- Load order: tokens -> base reset/utilities (`globals.css`) -> component `.module.css` -> behaviour JS.
- Each component owns its CSS module; no cross-component CSS imports.
- Surfaces are differentiated by **background fill only** - no visible border strokes on components.
  `--border` is reserved for `<hr>`, `border-collapse` tables, structural timeline dividers, and
  the background-colour gap trick in grids.
- `outline` is exclusively for focus rings - never decorative.
- Styling dependencies with their own CSS: **Leaflet** (DataMap), **Mermaid** (diagrams), **Excalidraw**.

---

## 2. Character Rules

All text in code, docs, and UI copy must use **printable ASCII only** (U+0020 to U+007E).
No Unicode typography characters, no emoji, no special symbols. If it is not on a standard
US keyboard, do not use it.

### Banned characters and their replacements

| Banned | Name | Use instead |
|---|---|---|
| `—` | em dash | `-` |
| `–` | en dash | `-` |
| `·` | middle dot | `|` (separator) or `,` (list) |
| `•` | bullet | `-` (markdown list item) |
| `…` | ellipsis | `...` |
| `"` `"` | curly double quotes | `"` |
| `'` `'` | curly single quotes / apostrophes | `'` |
| `→` `←` `↑` `↓` | arrows | `->` `<-` `^` (or rewrite the sentence) |
| `×` | multiplication sign | `x` |
| `≥` `≤` | comparison symbols | `>=` `<=` |
| `≠` `≈` | math symbols | `!=` `~=` |
| `°` | degree sign | `deg` or rewrite |
| `²` `³` | superscripts | `^2` `^3` |
| `★` `☆` | stars | spell it out |
| `✓` `✗` `✘` | check / cross marks | `[x]` `[ ]` or `yes` / `no` |
| `§` | section sign | `section` |
| Any emoji | - | nothing; rewrite without it |

### Why

- Renders identically in every terminal, editor, markdown renderer, and email client.
- No copy-paste encoding surprises.
- AI-generated content defaults to Unicode typography characters - this rule makes deviations
  immediately visible and easy to grep for.

### Enforcement

Run this to detect violations before committing:

```bash
LC_ALL=C grep -rn '[^ -~\t]' src/ docs/ --include="*.md" --include="*.ts" --include="*.tsx" --include="*.css"
```

Any output means a non-ASCII character is present. Fix it before merging.

---

## 3. Color - Primitives

Defined in `app/styles/globals.css` on `:root`. These are the authoritative live values.

```css
--white:        #ffffff
--black:        #000000

/* Neutral ramp */
--n-50:         #f6f6f6
--n-100:        #ebebeb
--n-200:        #d4d4d4
--n-300:        #b6b6b6
--n-400:        #989898
--n-500:        #7c7c7c
--n-600:        #616161
--n-700:        #474747
--n-800:        #303030
--n-900:        #1f1f1f
--n-950:        #111111

/* Accent */
--accent-brand: #008383
```

---

## 4. Color - Semantics

### Accent

```css
--primary:    var(--accent-brand)   /* #008383 */
--on-primary: var(--black)          /* text/icon on primary fill */
--fg-error:   #e55555
--fg-warning: #cccc00
```

### Light mode (default)

```css
--bg:           var(--n-50)         /* #f6f6f6 - page background */
--surface:      var(--n-50)         /* section/panel background */
--surface-card: var(--white)        /* card background */
--elevated:     var(--n-100)        /* chips, code blocks, hover fills */
--border:       var(--n-200)        /* hr, table borders, structural lines */
--fg:           var(--n-950)        /* primary text */
--fg-secondary: var(--n-600)        /* secondary text, nav links */
--fg-muted:     var(--n-500)        /* de-emphasised text, icons */
```

---

## 5. Dark Mode

### Mechanism

Dark mode is driven by a `dark-mode` class on `<body>` (not `prefers-color-scheme`). The user's
preference is stored in `localStorage` key `headlessengineer-theme`; the `ThemeScript` component
applies an `html.dark-mode-preload` class with identical token values in a `<head>` `<style>` to
prevent FOUC.

Scope options:
| Selector | Use |
|---|---|
| `body.dark-mode` | Global user preference |
| `html.dark-mode-preload` | FOUC prevention |
| `[data-theme="dark"]` | Section-level always-dark |

### Dark mode token values

```css
--bg:           var(--n-950)   /* #111111 */
--surface:      var(--n-900)   /* #1f1f1f */
--surface-card: var(--black)   /* #000000 */
--elevated:     var(--n-800)   /* #303030 */
--border:       var(--n-700)   /* #474747 */
--fg:           var(--white)   /* #ffffff */
--fg-secondary: var(--n-300)   /* #b6b6b6 */
/* --fg-muted and --primary are unchanged */
```

### Always-dark section pattern

Several sections (Hero, PageHero, MetricsStrip, Testimonials, CTA, ContentDetail header,
EngineerTemplate) are always dark regardless of user preference. The pattern:

```css
.section {
  background-color: var(--n-950); /* fixed primitive, not semantic */
}

:global(body:not(.dark-mode)) .section {
  --bg:           var(--n-950);
  --surface:      var(--n-900);
  --surface-card: var(--black);
  --elevated:     var(--n-800);
  --fg:           var(--white);
  --fg-secondary: var(--n-300);
  --fg-muted:     var(--n-400);
  --border:       var(--n-700);
}
```

---

## 6. Typography

### Font families

```css
--font-body:     Inter, system-ui, sans-serif           /* loaded via next/font */
--font-code:     'JetBrains Mono', 'Courier New', monospace
--font-wordmark: var(--font-bitcount), 'Bitcount Grid Double', sans-serif
                 /* app: local file /public/fonts/BitcountGridDouble-Variable.ttf via next/font/local */
                 /* HTML presentations: Google Fonts (see loading snippet below) */
```

#### Loading Bitcount Grid Double in HTML presentations

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bitcount+Grid+Double:wght@100..900&display=swap" rel="stylesheet">
```

Apply with font-variation-settings for consistent rendering:

```css
.wordmark {
  font-family: 'Bitcount Grid Double', sans-serif;
  font-optical-sizing: auto;
  font-weight: 300;   /* brand spec: always 300 for the wordmark/logo */
  font-style: normal;
  font-variation-settings: "slnt" 0, "CRSV" 0.5, "ELSH" 0, "ELXP" 0;
}
```

### Type scale

```css
--font-size-xs:      0.75rem    /*  12px */
--font-size-sm:      0.875rem   /*  14px */
--font-size-base:    1rem       /*  16px */
--font-size-lg:      1.125rem   /*  18px */
--font-size-xl:      1.3125rem  /*  21px */
--font-size-2xl:     1.5rem     /*  24px */
--font-size-3xl:     2rem       /*  32px */
--font-size-display: 3rem       /*  48px */
--font-size-hero:    clamp(3rem, 6vw, 5rem)  /* 48px -> 80px fluid */
```

### Font weights

```css
--font-weight-thin:       100
--font-weight-extralight: 200
--font-weight-light:      300
--font-weight-normal:     400
--font-weight-medium:     500
--font-weight-semibold:   600
--font-weight-bold:       700
--font-weight-extrabold:  800
--font-weight-black:      900
```

### Line heights & tracking

```css
--line-height-tight:   1
--line-height-base:    1.6
--line-height-relaxed: 1.8

--tracking-wider:      0.1em
```

### Global heading defaults (`globals.css`)

| Element | Size | Weight | Tracking | Case |
|---|---|---|---|---|
| `h1` | `--font-size-3xl` (32px) | 900 | `0.1em` | uppercase |
| `h2` | `--font-size-2xl` (24px) | 700 | `0.1em` | uppercase |
| `h3` | `--font-size-2xl` (24px) | 700 | `0` | - |
| `h4` | `--font-size-base` (16px) | 700 | `0.1em` | - |
| `h5` | `--font-size-base` (16px) | 700 | `0.1em` | uppercase |
| `h6` | `--font-size-xs` (12px) | 700 | `0.1em` | uppercase |

All headings: `font-family: --font-body`, `line-height: 1`, `margin-bottom: 16px`.

### Wordmark

```
font-family:           --font-wordmark (Bitcount Grid Double)
font-size:             28px (desktop) / 20px (<=768px)
font-weight:           300   /* brand spec - always light weight for logo */
letter-spacing:        0.04em
text-transform:        uppercase - always
font-variation-settings: "slnt" 0, "CRSV" 0.5, "ELSH" 0, "ELXP" 0
colour split:          HEADLESS -> var(--fg) | ENGINEER -> var(--primary)
```

---

## 7. Spacing

Two parallel token sets map to the same values - use `--sp-*` for named semantics.

```css
--sp-2xs  / --space-1:   4px
--sp-xs   / --space-2:   8px
--sp-sm   / --space-3:   12px
--sp-md   / --space-4:   16px
--sp-lg   / --space-6:   24px
--sp-xl   / --space-8:   32px
--sp-2xl  / --space-10:  40px
--sp-3xl  / --space-12:  48px
--sp-4xl  / --space-16:  64px
--sp-5xl  / --space-20:  80px
```

`--space-5, --space-7, --space-9` do not exist. Use the adjacent value.

---

## 8. Border Radius

```css
--radius / --radius-sm / --r-sm:   4px
--radius-md / --r-md:              8px
--radius-lg / --r-lg:              12px
--radius-xl / --r-xl:              16px
--radius-full / --r-full:          9999px
```

---

## 9. Shadows

Only two tokens exist; both are accent-coloured glows for hover states:

```css
--shadow-glow:    0 4px 24px color-mix(in srgb, var(--primary) 18%, transparent)
--shadow-glow-lg: 0 4px 32px color-mix(in srgb, var(--primary) 22%, transparent)
```

---

## 10. Motion

### Duration & easing

```css
--dur-fast:   150ms
--dur-base:   200ms
--dur-slow:   300ms
--dur-slower: 400ms

--ease-out:    ease-out
--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)
```

### Named animations

| Name | Used by | Spec |
|---|---|---|
| `reveal-in` | scroll-reveal utility | `opacity 0->1, translateY 16px->0`, `--dur-slow ease-out` |
| `marquee-scroll` | TechMarquee | `translateX(-50%)`, 60s linear infinite |
| `cursor-blink` | CodePanel | 1s `step-end` infinite |
| `availability-pulse` | AvailabilityBadge dot | `opacity 1->0.6->1`, 2s `ease-in-out` infinite |

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Each animated component also has its own `prefers-reduced-motion` block (marquee wraps to static
flex; cursor is static; Logo Swap has `transition: none`).

---

## 11. Opacity

```css
--op-dim:    0.3   /* decorative, placeholders - non-text only */
--op-muted:  0.6   /* icons, backdrops */
--op-subtle: 0.8   /* link hover, non-critical de-emphasis */
--op-full:   1
```

Primary interaction states are hardcoded on `.primary` button: hover `0.88`, active `0.76`.

---

## 12. Z-Index

```css
--z-raised:  10
--z-overlay: 50
             99   /* offcanvas backdrop - hardcoded */
--z-drawer:  100
--z-modal:   200
--z-toast:   300
             9999 /* SkipLink on :focus - hardcoded */
```

---

## 13. Layout & Grid

### Container & breakpoints

```css
--max-width:       1280px
--header-height:   64px
--side-padding:    16px   /* mobile */
                   24px   /* tablet */
                   0px    /* >=1280px - container handles gutters */

--breakpoint-sm:   768px
--breakpoint-md:   1024px
```

| Breakpoint | Behaviour |
|---|---|
| `<=768px` | 4 cols, full-width container, stacked layouts, offcanvas nav |
| `<=1024px` | Reduced columns, hero single-column |
| `>1280px` | Container hits max-width; viewport provides gutters |

### Container pattern (mandatory)

Every page and section that constrains content width must use this exact pattern:

```css
.container {
  max-width: var(--max-width); /* use --prose-max (65ch) only for pure long-form prose with no tables or code blocks */
  margin: 0 auto;
  padding: 0 var(--side-padding);
}
```

**Never** use a hardcoded horizontal padding value (e.g. `padding: 0 var(--sp-xl)`) with a
media query override. `--side-padding` is a responsive token that already resolves to 16px
(mobile), 24px (tablet), and 0px (>=1280px). Using it directly means no media query override
is needed and wide-screen padding is automatically removed.

This is also why `<main>` is unconstrained - see ADR-001. Sections own their own `.container`.

### Content widths

```css
--prose-max / --prose-max-width: 65ch
--card-min  / --size-card-min:   280px
```

### Section height scale

```css
--section-h-full:    100svh  /* hero */
--section-h-half:    50svh   /* card grids */
--section-h-third:   33svh   /* panels, forms */
--section-h-quarter: 25svh   /* CTA bands */
/* @supports fallback: svh -> vh */
```

### Page structure rule

Pages must not add a second `<main>` element. The root layout at `app/layout.tsx` already
wraps `{children}` in `<main id="main-content">`. Page components must return a fragment `<>`
or a block-level element (`<section>`, `<div>`, `<article>`), never `<main>`.

### Section padding rhythm

| Viewport | Vertical section padding |
|---|---|
| Desktop | `--sp-4xl` (64px) |
| Mobile | `--sp-3xl` (48px) |

No separator borders between sections - surfaces differentiated by background colour only.

---

## 14. Icons

**Icon library: Lucide - thin variant only.**

- Use `lucide-react` exclusively. No other icon sets, no emoji as icons.
- Always import the thin stroke variant. Do not use filled, bold, or default-weight Lucide icons.
- Size tokens:

```css
--size-icon-sm:  16px
--size-icon-md:  20px   /* default */
--size-icon-lg:  32px
--size-touch:    48px   /* minimum tap target wrapping an icon button - both axes */
```

- SVG attributes on every icon: `stroke-width: 1.5` | `fill: none` | `stroke: currentColor`
- Never set `fill` to anything other than `none` on Lucide icons.
- Icon colour inherits from `color: currentColor` - set it on the parent, not the icon itself.
- Decorative icons get `aria-hidden="true"`. Interactive icon-only buttons need a visually hidden label.

---

## 15. Accessibility Rules

1. `--fg` / `--fg-secondary` - must pass AAA (>=7:1) in both themes.
2. `--fg-muted` - large text / non-critical decorative elements only (4:1 light, 5:1 dark).
3. `--primary` - large text, bold, or filled elements only. Never small body text.
4. `--on-primary` on primary fill - 3.55:1 (documented known trade-off; passes 3:1 UI-component criterion).
5. Hero tagline rotator (14px JetBrains Mono, `--primary`) - sole documented WCAG AA deviation; content is supplementary.
6. Focus: `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: var(--radius-sm) }` - never removed.
7. Tap targets >= 48px both axes on every interactive element.
8. Status never by colour alone - icon + shape + text.
9. Syntax highlighting is monochrome - accent on keywords only.
10. Reduced motion: mandatory, globally collapsed + per-component.

---

## 16. Components

### Button

```
display:       inline-flex
font-weight:   600
font-size:     14px
padding:       12px 20px
border-radius: --r-md (8px)
min-height:    48px
transition:    150ms

.primary   bg --primary | color --white | hover opacity 0.88 | active opacity 0.76
.secondary bg transparent | color --fg | hover: bg --fg / color --bg (full invert)
disabled   opacity --op-dim | pointer-events none
focus      outline 2px solid --primary, offset 2px
```

### Badge

```
display:        inline-block
font-size:      12px | weight 600 | tracking 0.08em | uppercase
padding:        4px 10px
border-radius:  --r-sm (4px)
bg:             --elevated | color --fg-secondary
```

### Card

```
bg:             --surface-card
border-radius:  --r-lg (12px)
padding:        --space-6 (24px)
height:         100%
hover:          box-shadow --shadow-glow | translateY(-2px) | 150ms
[data-title]::before: 12px 600 0.08em uppercase --primary
```

### ServiceCard

Same hover pattern as Card. `.cardLink`: `inline-flex`, `gap: 6px`, `color: --primary`,
`font-size: 14px`, `font-weight: 600`.

### Tag

```
font:           12px | weight 600 | tracking 0.08em | uppercase
color:          --fg-secondary | bg --bg
border-radius:  --r-sm | padding 4px 8px
[href]:hover    color --primary
```

### FilterChip

```
bg:             --elevated | color --fg-secondary
border:         none | border-radius --r-full
padding:        8px 16px | min-height 44px
active:         bg --primary | color --on-primary
focus-visible:  outline-color --fg (not --primary - for contrast on active bg)
```

### Header

```
position:   sticky | top 0 | z-index --z-drawer (100)
height:     --header-height (64px)
bg:         --bg
container:  max-width 1280px | padding 0 var(--side-padding)
```

### NavLinks

```
color:       --fg-secondary | font-size 14px | weight 600 | tracking 0.04em | uppercase
min-height:  48px | transition --dur-fast
hover:       color --primary
active:      color --primary | weight 700
```

### OffcanvasNav

```
panel:      50vw wide (100vw <=768px) | right-sliding | z-index --z-drawer | bg --surface
open:       translateX(0) | spring transition --dur-slow
backdrop:   fixed inset 0 | black z-index 99 | opacity 0 -> --op-muted (0.6)
nav links:  20px | weight-light | uppercase | tracking 0.06em
hamburger:  48x48px (--size-touch) | transparent bg | elevated hover | radius --r-md
icons:      Lucide thin | stroke-width 1.5 | 20px
```

### Logo / Wordmark

```
font-family:           --font-wordmark (Bitcount Grid Double, local file / Google Fonts)
font-size:             28px (20px <=768px)
font-weight:           300   /* always light - brand spec */
font-variation-settings: "slnt" 0, "CRSV" 0.5, "ELSH" 0, "ELXP" 0
tracking:              0.04em | uppercase
.wordHead ->           --fg
.wordTail ->           --primary
"The Swap":            swapA slides up | swapB slides up from below on hover
                       transition --dur-fast --ease-spring | disabled under prefers-reduced-motion
```

### ThemeSwitcher

```
48x48px | transparent | radius --r-md | hover bg --elevated
icon: Lucide thin | stroke-width 1.5 | 20px | fill none
```

### Hero

```
min-height:   calc(var(--section-h-full) - var(--header-height))
bg:           always-dark (--n-950)
grid:         1.1fr 0.9fr -> 1fr <=1024px
heading:      --font-size-hero | bold | tracking -0.03em | line-height 1.0
              falls back to --font-size-3xl on mobile
description:  18px | line-height 1.6 | --fg-secondary
CTA row:      flex | gap 16px | flex-wrap wrap
```

### PageHero

```
Same always-dark treatment as Hero.
eyebrow:  --primary (not muted)
title:    --font-size-display (48px) | bold | tracking -0.02em
```

### MetricsStrip

```
bg:     always-dark (--n-950)
grid:   4-col -> 2-col <=768px
figure: --font-size-display (48px) | weight 900 | --primary | tracking -0.02em
label:  12px | --fg-muted | max-width 16ch
```

### TechMarquee

```
bg:        --surface | overflow hidden
animation: 60s linear infinite translateX(-50%)
items:     --font-code | 14px | --fg-muted | white-space nowrap
pauses on hover; wraps to static flex under prefers-reduced-motion
```

### HeroTaglineRotator

```
container:  24px tall | overflow hidden
track:      vertical translateY with --dur-slower --ease-spring
text:       JetBrains Mono | 14px | --primary
```

### CodePanel

```
bg:            --elevated | radius --r-lg (12px)
padding:       --sp-lg (24px) | font JetBrains Mono 14px / 1.7
header dots:   8x8px circles | radius full | --fg-muted | gap 6px | opacity --op-muted
syntax:
  .kw  -> --primary
  .fn  -> --fg weight 600
  .str -> --fg italic
  .cm  -> --fg-muted italic
  .op  -> --fg-secondary
cursor:        --primary | bold | cursor-blink 1s step-end infinite
```

### ArticleContent (prose)

```
base:         16px / line-height 1.8
links:        --primary | hover opacity --op-subtle (0.8)
inline code:  JetBrains Mono | 0.875em | bg --elevated | padding 1px 4px
pre:          bg --elevated | radius --r-lg | padding --sp-lg | 14px/1.7 JetBrains Mono
blockquote:   padding-left 16px | italic | --fg-muted
hr:           1px | bg --border
table thead:  bg --elevated
```

### Footer

```
grid:    1fr auto auto (wordmark + 2 link columns) -> 2-col <=1024px -> 1-col <=480px
links:   hover color --primary
heading: 12px | weight 700 | tracking 0.1em | uppercase | --fg-muted
tagline: 14px | --fg-secondary | max-width 32ch
```

### CTABand

```
bg:      always-dark (--n-950) | --section-h-quarter
title:   --font-size-hero | weight 900
rule:    60px x 2px | bg --primary | border none
buttons: flex | gap --sp-md | wrap | centered
```

### AvailabilityBadge

```
dot:  8x8px | radius full | bg --primary | availability-pulse 2s ease-in-out infinite
      static under prefers-reduced-motion
```

### SkipLink

```
position: absolute | top -40px
:focus -> top 0 | z-index 9999
```

### Pagination

```
flex | gap --space-4 | all items min 48x48px
active: --primary | bold
links:  --fg | hover --primary
```

---

## 17. Page Rhythm

| Section | Background |
|---|---|
| Hero / PageHero | `var(--n-950)` always-dark |
| MetricsStrip, Testimonials, CTA | `var(--n-950)` always-dark |
| CoreServices, Expertise, Offerings, Work, Articles listing | `var(--surface)` |
| Principles, Certifications, HowWeWork, Article prose body | `var(--bg)` |
| Contact form | `var(--bg)` |

Dark -> light -> dark alternation creates visual rhythm without decorative borders.

---

## 18. Brand Identity

| Property | Value |
|---|---|
| Name | `headlessengineer` (text) / `HEADLESSENGINEER` (logo) |
| One word | Never camelCase, never hyphenated |
| Tagline | "the head your problem needs." (sentence case, with full stop) |
| Vision | "tech solutions for business problems" |
| Voice | Senior engineer, outcome-first, no hype, sentence case, plain active verbs |
| Imagery | Grayscale / duotone (black->white) / tritone (black + accent + white). No stray hues. |
| Logo | Wordmark-only. No separate mark. HEADLESS -> `--fg`, ENGINEER -> `--primary`. |
| Logo Swap | Once per page load - animated. Disabled under reduced-motion. |
| Favicon | "HE" monogram - never the full wordmark |
| Client / white-label | Only `--primary` / `--on-primary` remapped. Logo goes monochrome in-product. |
| Presentations | Default dark |
| Email / docs | Light, max ~600px |
| OG images | Dark |

---

## 19. Presentation Rules

These rules apply to all presentation formats: HTML slides, PowerPoint/Keynote decks, Google
Slides, and PDF exports. The underlying principle is the same across all formats: the product or
content being presented is the main event. The headlessengineer brand is a credential - it
establishes trust and authorship but must never compete with the work.

This model is validated by McKinsey, BCG, Accenture (consulting standard) and Apple, Stripe,
Linear, Vercel (product standard). Both camps reach the same conclusion via different reasoning:
brand recognition comes from a consistent design system, not from repeating a logo.

---

### The core rule

The design system IS the brand signal on interior slides. The dark background, Inter uppercase
typography, #008383 accent, and monochrome imagery communicate "headlessengineer" without the
wordmark. Trust this. Do not compensate with extra logo appearances.

---

### Frequency: which slides get the wordmark

| Slide type | Wordmark |
|---|---|
| Cover / title | Yes - full treatment (see size rules below) |
| Section divider (no other content) | Optional - only if the slide is a pure brand moment |
| Interior content slide | No - brand is carried by the design system |
| Full-bleed image slide | No - the image is the communication; logo competes |
| Quote slide | No - the quote is the content; logo is noise |
| Closing / thank you | Yes - full treatment, mirrors the cover |

**Exception - self-running and unattended presentations** (trade show loops, embedded web
players, shared async links): apply the wordmark to every slide at footer size because a viewer
may enter at any point and needs instant attribution. Use the footer treatment (see below), not
the cover treatment.

**The consulting footer model**: if a client or context requires the logo on every slide, use the
three-zone footer strip - [project / client name left] [wordmark center, minimal size]
[page number right] - at 5-6pt equivalent text size, light gray weight. This is the McKinsey /
BCG / Accenture standard. The logo becomes a footer credential, not a headline.

---

### Position

| Context | Position | Rationale |
|---|---|---|
| Cover / closing slide | Centered or bottom-left | Full brand moment; no content to compete with |
| Section divider | Centered | Same as cover - pure brand moment |
| Footer (every-slide rule) | Bottom-right | Processed last in left-to-right reading order; content reads first |
| Co-brand cover | Client logo left, HE wordmark right | Client context leads; HE is the presenter credential |

Upper-left position signals "the company is the message." Lower-right signals "the content is
the message; we are the source." Default to lower-right whenever the slide contains any data,
copy, or visuals that are not purely brand.

---

### Size

All measurements assume a 1920x1080 base. Scale proportionally for other resolutions.

| Context | Wordmark height | Max slide area |
|---|---|---|
| Cover / closing full treatment | 48-72px | 10-15% of slide height |
| Section divider | 40-56px | 8-12% of slide height |
| Footer / every-slide treatment | 18-24px | 3-4% of slide height |
| Co-brand (matched with partner logo) | Match partner logo height | - |

Never let the wordmark exceed the height of the primary headline on a content slide. If those
two elements are on the same slide, the headline must be visually dominant.

---

### Clear space

Minimum clear space around the wordmark in all directions = 1x the wordmark cap-height (the
height of the uppercase "H" in the rendered wordmark at that size). This scales correctly as
the wordmark scales - do not use a fixed pixel value.

Edge margins:
- From slide edges: minimum 24px at 1920px width (scales proportionally)
- On content-heavy or data slides: increase to 1.5x cap-height clear space

Never let any other element (text, chart, divider line) enter the clear space zone.

---

### Logo variant by background

| Slide background | Wordmark variant |
|---|---|
| Dark (default) - `--n-950` / `--n-900` | HEADLESS white / ENGINEER `--primary` (#008383) |
| Light - `--n-50` / white | HEADLESS `--fg` (`--n-950`) / ENGINEER `--primary` (#008383) |
| Full-colour / photography | Wordmark omitted; or monochrome white if attribution is required |
| Client-branded deck | Monochrome only - single color, either white or `--n-950` depending on bg |

The two-tone colour split (HEADLESS/ENGINEER) is reserved for headlessengineer-branded contexts.
In client decks or co-branded work, use the monochrome version.

---

### Co-branding rules

These follow the professional services standard (McKinsey, Accenture, IFRC co-brand guidelines).

1. Client logo leads - left position (first in reading order). HE wordmark follows - right
   position. This applies on cover and closing slides.
2. Match heights - both logos rendered at the same optical height. Do not match bounding boxes;
   match perceived visual weight.
3. Use a relationship clarifier when the nature of the collaboration is not obvious:
   "Prepared by headlessengineer" or "in partnership with" as small caption text below the HE
   wordmark.
4. On interior slides: both logos move to the footer at minimal size, or the HE wordmark is
   omitted entirely if the client owns the deliverable. The client's design system and brand
   drive interior slides.
5. Never place multiple partner logos on a content slide. If multiple partners must be shown,
   dedicate a standalone "partners" or "clients" slide.
6. For client-owned deliverables: HE brand defers entirely to the client context. Cover credit
   in the footer ("Prepared by headlessengineer") is sufficient.

---

### HTML presentation specifics

- **Asset format**: SVG only for all wordmark instances. Never PNG or raster. SVG scales from
  phone to 4K projector without any quality loss.
- **Positioning layer**: implement logo placement via CSS on the theme/template layer (equivalent
  to a slide master), not embedded in individual slide content. In reveal.js or similar, this
  is the theme, not the slide section.
- **Responsive sizing**: define wordmark width as a `vw` percentage with a `clamp()` so it does
  not become illegible on small screens or oversized on projectors. Example:
  `width: clamp(80px, 6vw, 160px)` for a cover treatment.
- **Variant switching**: the dark/light wordmark variant must switch automatically with the slide
  background. Implement via a `data-bg` attribute on each slide section and a CSS rule that
  targets it. Never hard-code the colour directly on the SVG `fill`.
- **Async/shared links**: treat as self-running - apply footer wordmark to every slide (see
  frequency rules above).

---

### Cover slide layout rules

These rules apply to the title / opening slide of any HTML presentation.

#### Product name

The product name is the dominant visual on the cover slide. It must be:

- The **largest typographic element** on the slide - larger than the wordmark at any viewport size
- **Uppercase** always
- **Weight 900** (black) - maximum visual weight
- **Centred** horizontally and vertically in the slide body
- Font size: `clamp(52px, 9.5vw, 116px)` at 1920x1080 base; scale with `clamp()` for other resolutions

CSS class reference:

```css
.product-title {
  font-size: clamp(52px, 9.5vw, 116px);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 0.92;
  text-transform: uppercase;
  color: var(--fg);
  text-align: center;
}
```

#### Logo position on the cover slide

The wordmark sits in the **top-left corner** of the cover slide. It is a credential, not the headline.

- Position: `position: absolute; top: var(--pad); left: var(--pad)` - the slide's own padding provides the clear space, no extra offset needed
- Size: `clamp(16px, 2vw, 26px)` - visibly smaller than the product name at every breakpoint
- Font weight: 300 (same as all other wordmark instances)
- This is the only slide where the logo moves from the footer zone to a content zone

CSS class reference:

```css
.slide-logo-topleft {
  position: absolute;
  top: var(--pad);
  left: var(--pad);
  z-index: 1;
}
```

HTML pattern:

```html
<div class="slide active" ...>
  <div class="slide-logo-topleft">
    <div class="wordmark" style="font-size:clamp(16px,2vw,26px);">
      <span class="wm-head">Headless</span><span class="wm-eng">Engineer</span>
    </div>
  </div>
  <div class="slide-body slide-body--center">
    <h1 class="product-title">PRODUCT NAME</h1>
    <!-- lead text, pills -->
  </div>
  <div class="slide-footer">...</div>
</div>
```

Animation order on the cover slide: logo animates first (`.anim`), product name second (`.anim-2`), supporting copy third (`.anim-3`). The logo leads because it establishes authorship before the content lands.

---

### Scroll mode footer rule

When a presentation is viewed in scroll mode (`body.scroll-mode`), the three-zone footer strip is redundant - it would repeat on every "page" of a continuous scroll document. The rule:

- **Hide** all slide footers in scroll mode
- **Show** the footer on the **final slide only** - it acts as a single closing attribution

```css
body.scroll-mode .slide-footer { display: none; }
body.scroll-mode .slide:last-child .slide-footer { display: flex; }
```

This matches the convention used in long-form editorial and documentation: a single byline at the end, not repeated throughout. In slide-navigation mode the footer is always visible on every slide because viewers may enter at any point.

---

### Q&A slide

Every deck that will be presented live must include a Q&A slide immediately before the Thank You slide.

**Purpose:** signals a deliberate pause and gives the audience a visual anchor for the open-floor moment. A blank screen or returning to a content slide creates ambiguity.

**Rules:**

- Content is minimal - the slide does one job: open the floor
- The letter pair `Q&A` is the dominant visual, sized at `clamp(60px, 12vw, 140px)` weight-900
- The ampersand `&amp;` is rendered in `--primary` (teal) - the only accent on the slide
- An eyebrow label ("Open floor") sits above; a single lead sentence below invites the specific topics in scope
- No cards, no lists, no code - silence is the design
- Footer present in slide-navigation mode; hidden in scroll mode (follows the standard rule)
- `data-slide-section=""` - no section label; this is outside the content arc

```html
<div class="slide" data-slide-title="Q and A" data-slide-section="">
  <div class="slide-body slide-body--center" style="justify-content:center;gap:18px;">
    <p class="eyebrow anim">Open floor</p>
    <h2 class="section-break-title anim-2" style="text-align:center;font-size:clamp(60px,12vw,140px);">
      Q<span class="accent">&amp;</span>A
    </h2>
    <p class="lead anim-3" style="text-align:center;max-width:520px;">
      Ask anything - [scope the topics for your audience here].
    </p>
  </div>
  <div class="slide-footer">...</div>
</div>
```

---

### Thank You slide

The Thank You slide is always the **last slide** in any deck. It mirrors the cover in visual weight and serves as the bookend that closes the brand moment.

**Rules:**

- Must be the last `.slide` element - the scroll-mode footer rule targets `:last-child`, so position matters
- Full wordmark treatment centred at the same size used on the closing/CTA slide: `clamp(22px, 4.2vw, 52px)`
- "THANK YOU" is the dominant text, `section-break-title` sizing (`clamp(50px, 9vw, 108px)`), weight-900, uppercase
- A single short closing line in `.lead` - one sentence, no bullet points
- Contact or repo URL below the lead in `.mono` style - gives the audience something to act on
- `data-slide-section=""` - no section label
- Footer is always present and is the only footer visible in scroll mode

```html
<div class="slide" data-slide-title="Thank You" data-slide-section="">
  <div class="slide-body slide-body--center" style="justify-content:center;gap:22px;">
    <div class="anim">
      <p class="eyebrow" style="margin-bottom:16px;">[Product or project name]</p>
      <div class="wordmark"><span class="wm-head">Headless</span><span class="wm-eng">Engineer</span></div>
    </div>
    <h2 class="section-break-title anim-2" style="text-align:center;font-size:clamp(50px,9vw,108px);">
      THANK<br>YOU
    </h2>
    <p class="lead anim-3" style="text-align:center;max-width:480px;">
      [One closing sentence.]
    </p>
    <div class="anim" style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:4px;">
      <span class="mono" style="color:var(--fg);">headlessengineer.xyz</span>
      <span style="color:var(--fg-muted);">[repo or contact URL]</span>
    </div>
  </div>
  <div class="slide-footer">
    <span class="footer-section">headlessengineer.xyz</span>
    <span class="footer-wordmark"><span class="wm-head">Headless</span><span class="wm-eng">Engineer</span></span>
  </div>
</div>
```

**Slide order at end of every deck:**

```
[last content slide]
[Q&A slide]          <- penultimate
[Thank You slide]    <- always last; sole footer in scroll mode
```

---

### Code blocks in HTML presentations

HTML presentations use the same CodePanel component spec as the app (see section 16). Never
invent a custom code-block pattern - always apply the three-part structure below.

**Required HTML structure:**

```html
<div class="code-panel [anim-class]">
  <div class="code-panel-header">
    <span class="code-dot"></span><span class="code-dot"></span><span class="code-dot"></span>
  </div>
  <pre class="code-body" style="font-size:clamp(10px,1.2vw,13px);">
    <span class="kw">const</span> <span class="fn">example</span> = <span class="str">'value'</span>
    <span class="cm">// comment</span>
  </pre>
</div>
```

**Rules:**

- The animation class (`.anim-2`, `.anim-3`, etc.) goes on the **outer `.code-panel` div**, not on `.code-body`
- Code content lives in a `<pre class="code-body">` element - never a `<div>`; `<pre>` preserves whitespace correctly and avoids the need for `white-space: pre` workarounds
- The `<pre>` content must start immediately after the `>` of the opening tag (no leading newline) to avoid a blank first line in the rendered output
- Default font-size: `clamp(11px, 1.3vw, 14px)` - applied via CSS on `.code-body`
- Dense content (many lines, wide identifiers): override with `style="font-size:clamp(10px,1.2vw,13px);"` on the `<pre class="code-body">` element
- Width constraints (e.g. a narrow standalone panel): add `style="max-width:380px;width:100%;"` to the outer `.code-panel` div only

**CSS for presentation use:**

```css
.code-panel {
  background: var(--elevated);
  border-radius: var(--r-lg);
  padding: 24px;   /* --sp-lg */
  overflow: auto;
}
.code-panel-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 16px;
  opacity: 0.6;    /* --op-muted */
}
.code-dot {
  width: 8px; height: 8px; border-radius: 9999px;
  background: var(--fg-muted); flex-shrink: 0;
}
.code-body {
  font-family: var(--font-mono);
  font-size: clamp(11px, 1.3vw, 14px);
  line-height: 1.7; white-space: pre;
  margin: 0; color: var(--fg-secondary);
}
/* syntax tokens */
.kw  { color: var(--primary); }
.fn  { color: var(--fg); font-weight: 600; }
.str { color: var(--fg); font-style: italic; }   /* italic - matches component spec */
.cm  { color: var(--fg-muted); font-style: italic; }
.op  { color: var(--fg-secondary); }
```

---

### What the design system carries on your behalf

On every interior slide, these elements signal headlessengineer without a wordmark:

| Element | Signal |
|---|---|
| Dark background `--n-950` | Premium, engineering, "after hours" aesthetic |
| `--primary` #008383 accent on key data / CTAs | Distinctive brand color |
| Inter uppercase headings, tight tracking | Confident, structured, no decoration |
| JetBrains Mono for code / data | Technical authority |
| Lucide thin icons at 1.5 stroke-weight | Consistent visual grammar |
| Monochrome imagery + accent highlights | Controlled, intentional, brand-coherent |

If these are applied consistently, the wordmark on the cover alone is sufficient for any
audience to associate the full deck with headlessengineer by the time they reach slide 3.
