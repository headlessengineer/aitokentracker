# Slide Anatomy

Standard structure and reusable CSS components for headlessengineer HTML presentations.
Importing these patterns keeps new decks token-efficient and brand-consistent — reference
this file instead of regenerating CSS.

---

## Zone Model

Every slide is divided into three vertical zones:

```
┌──────────────────────────────────────────────────────────┐
│  HEADER   eyebrow · section-title (or wordmark on hero)  │  flex-shrink: 0
├──────────────────────────────────────────────────────────┤
│                                                          │
│  BODY     main content — grids, lists, tables, charts    │  flex: 1
│                                                          │
├──────────────────────────────────────────────────────────┤
│  FOOTER   section name (left) · mini wordmark (right)    │  flex-shrink: 0
└──────────────────────────────────────────────────────────┘
```

### CSS

```css
/* ── Anatomy zones ─────────────────────────────────────── */
.slide-content {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 0;
    gap: 0;
}

.slide-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding-bottom: 16px;
}
.slide-header--left { align-items: flex-start; text-align: left; }

.slide-body {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;
    overflow: hidden;
    min-height: 0;
}

.slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex-shrink: 0;
    padding-top: 12px;
    /* no border — design is borderless; surfaces differ by fill only */
}
.slide-footer .footer-section {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--fg-muted);
}
.slide-footer .footer-wordmark {
    font-family: var(--font-wordmark);
    font-size: 12px;
    font-weight: 400;   /* site: Logo.module.css font-weight: 400 */
    text-transform: uppercase;
    letter-spacing: 0.04em;
    line-height: 1;
}
.slide-footer .footer-wordmark .wm-head { color: var(--fg-muted); }
.slide-footer .footer-wordmark .wm-eng  { color: var(--primary); }
```

### HTML pattern

```html
<div class="slide">
    <div class="slide-content slide-content--wide">

        <div class="slide-header">
            <p class="eyebrow">Section Label</p>
            <h2 class="section-title">Slide Heading</h2>
        </div>

        <div class="slide-body">
            <!-- grid / list / table / chart here -->
        </div>

        <div class="slide-footer">
            <span class="footer-section">Section Name</span>
            <span class="footer-wordmark">
                <span class="wm-head">Headless</span><span class="wm-eng">Engineer</span>
            </span>
        </div>

    </div>
</div>
```

---

## Typography Hierarchy

| Class | Size (clamp) | Weight | Color | Use |
|---|---|---|---|---|
| `.eyebrow` | `0.72rem` | 600 | `--primary` | Category / section label |
| `.slide-title` | `clamp(32px,6vw,76px)` | 700 | `--fg` | Hero headline (title slide only) |
| `.section-title` | `clamp(24px,3.4vw,42px)` | 700 | `--fg` | Slide heading |
| `h3` (in `.card`) | `clamp(15px,1.55vw,19px)` | 600 | `--fg` | Card / list item heading |
| `.lead` | `clamp(16px,2.1vw,24px)` | 400 | `--fg-secondary` | Intro paragraph under heading |
| `p` | `clamp(14px,1.8vw,19px)` | 400 | `--fg-secondary` | Body copy |
| `.caption` | `11px` | 400 | `--fg-muted` | Source, footnote, disclaimer |
| `.mono` | inherit | 400 | `--fg` | Code, metric label, tech stack tag |

---

## List Patterns

### Check list — outcomes, proof, deliverables

```html
<ul class="list-check stagger">
    <li>65% reduction in deployment time</li>
    <li>26 countries, zero stack constraints</li>
    <li>AI pilot taken from PoC to production</li>
</ul>
```

```css
.list-check { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.list-check li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: clamp(14px,1.8vw,18px); color: var(--fg-secondary); line-height: 1.5;
}
.list-check li::before {
    content: '✓'; color: var(--primary); font-weight: 700;
    flex-shrink: 0; margin-top: 1px;
}
```

### Bullet list — features, details

```html
<ul class="list-bullet stagger">
    <li>API-first, domain-driven design</li>
    <li>Test-first delivery on every engagement</li>
</ul>
```

```css
.list-bullet { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.list-bullet li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: clamp(14px,1.8vw,18px); color: var(--fg-secondary); line-height: 1.5;
}
.list-bullet li::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--primary); flex-shrink: 0; margin-top: 7px;
}
```

### Numbered list — steps, process

```html
<ol class="list-numbered stagger">
    <li>Assess the business problem</li>
    <li>Design the roadmap</li>
    <li>Build and ship</li>
</ol>
```

```css
.list-numbered {
    list-style: none; padding: 0; counter-reset: step;
    display: flex; flex-direction: column; gap: 8px;
}
.list-numbered li {
    display: flex; align-items: flex-start; gap: 14px;
    font-size: clamp(14px,1.8vw,18px); color: var(--fg-secondary);
    line-height: 1.5; counter-increment: step;
}
.list-numbered li::before {
    content: counter(step, decimal-leading-zero);
    font-family: var(--font-mono); font-size: 12px; color: var(--primary);
    flex-shrink: 0; padding-top: 3px; min-width: 22px;
}
```

---

## Table Pattern

```html
<table class="slide-table">
    <thead>
        <tr><th>Engagement model</th><th>Typical service</th><th>Shape</th></tr>
    </thead>
    <tbody>
        <tr><td>Discovery sprint (2–4 wks)</td><td>Technology Strategy</td><td>Roadmap</td></tr>
    </tbody>
</table>
```

```css
.slide-table { width: 100%; border-collapse: collapse; font-size: clamp(12px,1.5vw,16px); }
.slide-table th {
    text-align: left; font-size: 11px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--primary); padding: 8px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}
.slide-table td {
    padding: 9px 14px; color: var(--fg-secondary);
    border-bottom: 1px solid rgba(255,255,255,0.04); line-height: 1.4;
}
.slide-table tr:last-child td { border-bottom: none; }
.slide-table tbody tr:hover td { background: rgba(255,255,255,0.03); }
.slide-table .td-accent { color: var(--fg); font-weight: 500; }
```

---

## Chart Patterns (CSS — no library)

### Horizontal bar chart

```html
<div class="bar-chart stagger">
    <div class="bar-row">
        <span class="bar-label">Go</span>
        <div class="bar-track"><div class="bar-fill" style="width:90%"></div></div>
        <span class="bar-value mono">Expert</span>
    </div>
    <div class="bar-row">
        <span class="bar-label">TypeScript</span>
        <div class="bar-track"><div class="bar-fill" style="width:80%"></div></div>
        <span class="bar-value mono">Advanced</span>
    </div>
</div>
```

```css
.bar-chart { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { font-size: 13px; color: var(--fg-secondary); min-width: 90px; text-align: right; }
.bar-track { flex: 1; height: 5px; background: var(--surface); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--primary); border-radius: 3px; }
.bar-value { font-size: 12px; color: var(--fg-muted); min-width: 64px; }
```

---

## Quick-Reference: Slide Compositions

| Slide type | Header | Body component | Footer |
|---|---|---|---|
| Title / hero | wordmark + tagline | `.lead` paragraph | `headlessengineer.xyz` |
| Section break | eyebrow + section-title | single `.lead` sentence | section name |
| 3-card grid | eyebrow + section-title | `.grid.grid-3` of `.card` | section name |
| 4-metric row | eyebrow + section-title | `.grid.grid-4` of `.metric` | section name |
| Split narrative | eyebrow + section-title | `.split` (text + grid) | section name |
| Check list | eyebrow + section-title | `.list-check` | section name |
| Bullet list | eyebrow + section-title | `.list-bullet` | section name |
| Table | eyebrow + section-title | `.slide-table` | section name |
| CTA | wordmark | h2 + `.lead` + `.cta-btn` | contact line |

---

## Slide-Content Variants

| Class | Effect |
|---|---|
| `.slide-content--wide` | `max-width: 1100px` — most content slides |
| `.slide-content--narrow` | `max-width: 720px` — centred text / hero |
| `.slide-content--left` | `align-items: flex-start; text-align: left` |

---

## Theme System

Decks support light and dark mode via `body.dark-mode`. The shared runtime
(`presentation.js`) persists the user's choice to `localStorage` under the key
`he-presentation-theme`. Presentations start in dark mode by default.

### Token Pattern (mirrors `globals.css`)

```css
/* ── Light default (:root) ──────────────────────────── */
:root {
    --bg:           #fafafa;   /* n-50 */
    --surface:      #fafafa;   /* n-50 */
    --surface-card: #ffffff;   /* white */
    --elevated:     #f2f2f2;   /* n-100 */
    --border:       #e0e0e0;   /* n-200 */
    --fg:           #0a0a0a;   /* n-950 */
    --fg-secondary: #4d4d4d;   /* n-600 */
    --fg-muted:     #808080;   /* n-500 — constant */
    --primary:      #009999;
    --on-primary:   #ffffff;
}

/* ── Dark override (body.dark-mode) ─────────────────── */
body.dark-mode {
    --bg:           #0a0a0a;   /* n-950 */
    --surface:      #141414;   /* n-900 */
    --surface-card: #000000;   /* black */
    --elevated:     #1f1f1f;   /* n-800 */
    --border:       #2e2e2e;   /* n-700 */
    --fg:           #ffffff;
    --fg-secondary: #b3b3b3;   /* n-300 */
    /* --fg-muted and --primary stay constant */
}
```

`<body class="dark-mode">` in the HTML ensures dark is the visual default even
before JS runs, and presentation.js reads localStorage on init to restore the
last saved preference.

---

## Slide Metadata Attributes

Every `.slide` should carry two `data-*` attributes — they populate the offcanvas navigator:

```html
<div class="slide active"
     data-slide-title="Opening"
     data-slide-section="Intro">
```

| Attribute | Required | Value |
|---|---|---|
| `data-slide-title` | Yes | Short label shown in offcanvas list |
| `data-slide-section` | No | Section grouping shown above title; omit for untitled sections |

---

## Offcanvas Navigator CSS

The offcanvas is injected by `presentation.js`; the host deck must provide these
CSS classes (or include the block below verbatim):

```css
/* ── Offcanvas (mirrors OffcanvasNav.module.css) ─────── */
.oc-backdrop {
    position: fixed; inset: 0;
    background: #000; opacity: 0;
    z-index: 99; pointer-events: none;
    transition: opacity 200ms ease-out;
}
.oc-backdrop--open { opacity: 0.6; pointer-events: auto; }

.oc-panel {
    position: fixed; top: 0; right: 0;
    height: 100%; width: 50vw; max-width: 480px;
    background: var(--surface); z-index: 100;
    display: flex; flex-direction: column;
    transform: translateX(100%); visibility: hidden;
    transition: transform 300ms cubic-bezier(0.16,1,0.3,1),
                visibility 0s 300ms;
}
.oc-panel--open {
    transform: translateX(0); visibility: visible;
    transition: transform 300ms cubic-bezier(0.16,1,0.3,1), visibility 0s;
}

.oc-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; }
.oc-wordmark { font-family: var(--font-wordmark); font-size: 20px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; }
.oc-wm-head { color: var(--fg); }
.oc-wm-eng  { color: var(--primary); }
.oc-header-actions { display: flex; align-items: center; gap: 2px; }

.oc-icon-btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 48px; height: 48px;
    background: transparent; border: none; cursor: pointer;
    color: var(--fg); border-radius: 8px;
    transition: background 150ms ease-out;
}
.oc-icon-btn:hover { background: var(--elevated); }
.oc-icon-btn svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 1.5; fill: none; }

.oc-nav { flex: 1; overflow-y: auto; padding: 4px 16px 16px; }
.oc-slide-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 2px; }

.oc-slide-btn {
    width: 100%; display: flex; align-items: center; gap: 14px;
    padding: 10px 12px; background: transparent; border: none;
    cursor: pointer; color: var(--fg-secondary); border-radius: 8px; text-align: left;
    transition: background 150ms ease-out, color 150ms ease-out;
}
.oc-slide-btn:hover  { background: var(--elevated); color: var(--fg); }
.oc-slide-btn.oc-slide-active { color: var(--primary); }

.oc-slide-num { font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted); flex-shrink: 0; min-width: 20px; }
.oc-slide-active .oc-slide-num { color: var(--primary); }
.oc-slide-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.oc-slide-section { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-muted); }
.oc-slide-title-text { font-size: 13px; font-weight: 500; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.oc-footer { flex-shrink: 0; padding: 12px 24px 16px; border-top: 1px solid var(--border); }
.oc-hint { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-muted); }
```

---

## Keyboard Shortcuts (provided by presentation.js)

| Key | Action |
|---|---|
| `← / →` | Previous / next slide (presentation mode) |
| `Space` | Next slide (presentation mode) |
| `T` | Toggle light / dark theme (persisted to localStorage) |
| `P` | Toggle presentation / scroll mode |
| `O` | Toggle offcanvas slide navigator |
| `Escape` | Close offcanvas |
| Click (non-button) | Next slide (presentation mode) |

---

## Scroll Mode CSS

```css
body.scroll-mode { overflow-y: auto; }

body.scroll-mode .slide-deck {
    position: static; width: 100%; height: auto;
    max-width: none; max-height: none; overflow: visible;
}
body.scroll-mode .slide {
    position: relative; inset: unset;
    opacity: 1 !important; visibility: visible !important;
    min-height: 100svh; height: auto; transition: none;
}
```

---

## Token Quick-Reference

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--bg` | `#fafafa` | `#0a0a0a` | Slide / body background |
| `--surface` | `#fafafa` | `#141414` | Panel surfaces (offcanvas) |
| `--surface-card` | `#ffffff` | `#000000` | Card / metric background |
| `--elevated` | `#f2f2f2` | `#1f1f1f` | Badge / pill / hover |
| `--border` | `#e0e0e0` | `#2e2e2e` | Tables, offcanvas footer |
| `--fg` | `#0a0a0a` | `#ffffff` | Primary text |
| `--fg-secondary` | `#4d4d4d` | `#b3b3b3` | Secondary text |
| `--fg-muted` | `#808080` | `#808080` | Muted — constant |
| `--primary` | `#009999` | `#009999` | Accent — constant |

---

## Design Invariants (reminder)

1. **One accent** — `#009999` only. No second hue.
2. **No borders** — surfaces by fill only; never strokes. `--border` only in tables and offcanvas footer.
3. **Inter** everywhere except wordmark (Bitcount Grid Double, weight 400) and code (JetBrains Mono).
4. **Wordmark weight is always 400** — the lightest available weight for Bitcount Grid Double.
5. **Card / metric background is `--surface-card`**, not `--surface`. Elevated cards use `--elevated`.
6. **Card labels always teal** — matches `card[data-title]::before` on the site. Never `--fg-muted`.
7. **Badge / pill uses `--elevated` background** — matches Badge component CSS.
8. **Accent rationed** — eyebrows, metric figures, check marks, CTA button, wordmark accent, links. Never body text or large fills.
9. **Dark default** — `<body class="dark-mode">` in the HTML; JS respects localStorage.
10. **AAA contrast** — `--fg` / `--fg-secondary` on `--bg` / `--surface-card` in both themes.
11. **Reduced motion** — all animations gated on `.slide.active`; override to `none` under `prefers-reduced-motion`.
