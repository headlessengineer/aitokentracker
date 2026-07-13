# Layout, Dark Mode & Responsive

## Grid

Container centered, max-width 1280px.

| Breakpoint | Columns | Gutters |
|---|---|---|
| Desktop (>1024px) | 12 | 24px |
| Tablet (≤1024px) | 8 | 16px |
| Mobile (≤768px) | 4 | 16px, full-width container |

Header/nav: 64px, `bg` fill.

**Sections:** vertical padding `4xl` (64px) desktop / `3xl` (48px) mobile.
Vertical rhythm by spacing alone — no separator borders between sections.

**Hero containers:** always `max-width: var(--max-width)` (1280px). Never use a narrower
hardcoded value (860px, 760px, etc.) — the container's internal padding and the copy's
natural line length already control reading width.

---

## Section Min-Height Scale

Four tokens cover every section. Choose by content density; hero is always full.

| Token | Value | Use |
|---|---|---|
| `--section-h-full` | 100vh / 100svh | Every hero section — non-negotiable |
| `--section-h-half` | 50vh / 50svh | Card grids with 3–8 items (CoreServices, Expertise, Principles, Certifications, Testimonials, offerings, methods) |
| `--section-h-third` | 33vh / 33svh | Single-concept panels and forms (howWeWork, contact form, Spotlight) |
| `--section-h-quarter` | 25vh / 25svh | CTA bands — title + action only |

**Rules:**
- Use `--section-h-full` for every `.pageHero` and the Home `Hero` organism. No exceptions.
- Never use the legacy `--section-min-h` for new sections; it remains only on error/not-found pages.
- `svh` overrides are declared in globals.css under `@supports (min-height: 1svh)` — do not add them per-component.

---

## Page Section Rhythm

Pages alternate dark / surface / bg backgrounds. Hero is always dark; CTA anchors
the bottom. Middle sections alternate `surface` (slight offset from `bg`) and `bg`.

| Page | Section | Background |
|---|---|---|
| All | Hero / article detail header | `n-950` (always dark) |
| Home | MetricsStrip, Testimonials | `n-950` (always dark) |
| Home | CoreServices, Expertise | `surface` |
| Home | Principles, Certifications | `bg` |
| About | Founder, CoreServices, Expertise, TechMarquee | `surface` |
| About | HowWeWork, Principles, Certifications | `bg` |
| Services | Offerings | `surface` |
| Contact | Methods | `surface` |
| Contact | Form | `bg` |
| Work | ProjectGrid | `surface` |
| Articles listing | ArticleGrid | `surface` |
| Article detail | Prose body | `surface` |
| All | CTA | `n-950` (always dark) |

---

## Dark Mode

Toggled by `dark-mode` class on `body`. A **neutral-semantic swap**: `bg`,
`surface`, `elevated`, `border`, `fg`, `fg-secondary` flip to dark values;
`fg-muted` and the accent stay constant. Primitives never change.

Preference persists in `localStorage` under `headlessengineer-theme`; defaults
to `prefers-color-scheme`.

---

## Always-Dark Section Pattern

Some sections are permanently dark regardless of the global theme: hero headers,
metrics strips, testimonials, CTAs, and article detail headers.

**Implementation:**

```css
.section {
  background-color: var(--n-950); /* fixed primitive, not semantic */
}

/* Remap semantics for light mode only */
:global(body:not(.dark-mode)) .section {
  --bg: var(--n-950);
  --fg: var(--white);
  --fg-secondary: var(--n-300);
  --fg-muted: var(--n-400);
  --border: var(--n-700);
}

/* Sections with cards also need: */
:global(body:not(.dark-mode)) .section {
  --surface-card: var(--black);
  --elevated: var(--n-800);
}

/* Hero sections also need: */
:global(body:not(.dark-mode)) .section {
  --surface: var(--n-900);
}
```

In dark mode, the global `body.dark-mode` swap already covers them — no local
remap needed.

**Critical:** Headings on always-dark sections must declare `color: var(--fg)`
explicitly in their CSS class — CSS inheritance resolves the body's computed color
before the local remap fires.

**Invariant:** every always-dark section must include the full token remap block.
Never hardcode `color: white`.

---

## Sizing Constants

| Token | Value | Use |
|---|---|---|
| `--size-icon-sm` | 16px | Small inline icons |
| `--size-icon-md` | 20px | Standard icons |
| `--size-icon-lg` | 32px | Large icon buttons |
| `--size-touch` | 48px | Minimum tap target, both axes |
| `--prose-max-width` | 65ch | Body paragraph max width |
| `--size-card-min` | 280px | Card grid reflow threshold |

Icons render at `stroke-width: 1.5` in `fg`/current color; accent only for the
single emphasized icon.

---

## Z-Index

| Token | Value |
|---|---|
| base | 0 |
| raised | 10 |
| overlay | 50 |
| drawer | 100 |
| modal | 200 |
| toast | 300 |

Offcanvas backdrop at 99.

---

## Opacity Scale

| Token | Value | Use |
|---|---|---|
| `opacity-dim` | 0.3 | Decorative / placeholder — non-text only |
| `opacity-muted` | 0.6 | Icons, backdrops |
| `opacity-subtle` | 0.8 | Link hover, non-critical de-emphasis |
| `opacity-full` | 1 | Default |

Opacity drives **accent interaction states** (button hover 0.88, active 0.76)
since the accent has no tints/shades. Text de-emphasis uses `fg-secondary`/
`fg-muted`, never lowered text opacity.

---

## Motion

| Token | Value |
|---|---|
| `duration-instant` | 0ms |
| `duration-fast` | 150ms |
| `duration-base` | 200ms |
| `duration-slow` | 300ms |
| `duration-slower` | 400ms |
| `ease-out` | ease-out |
| `ease-in-out` | ease-in-out |
| `ease-spring` | cubic-bezier(0.16, 1, 0.3, 1) |

No `ease-in`. Compose transitions from tokens.

**Reduced motion is mandatory** — a global block collapses all transitions to
instant and stops any looping animation (including The Swap).

### The Swap Signature

The ENGINEER half of the wordmark performs a 150ms character swap on hover.
Used **once per page** (logo in nav), optionally one hero moment. Never scattered.
Disabled entirely under `prefers-reduced-motion`.

---

## Responsive Strategy

| Breakpoint | Change |
|---|---|
| ≤1024px | Grid 12→8 cols; hero two-column → single |
| ≤768px | Grid →4; container full width; `display` 48→32px; button groups stack; nav → offcanvas |

Body text stays ≥ 16px at all breakpoints.

---

## Borderless Rule

No `border` declarations as visible strokes on components. Surfaces are
differentiated by background fill alone (`bg` → `surface` → `elevated`).

- `--border` token exists for rare structural exceptions (`border-collapse`,
  `border-radius`, `border: none` resets) — never as a visible stroke on components.
- `outline` is used exclusively for focus rings; never repurposed as decorative border.

---

## FOUC Prevention

1. Inline `<head>` script (before stylesheets): read `headlessengineer-theme`
   (and `prefers-color-scheme` fallback); if dark, add `dark-mode-preload` to `<html>`.
2. Inline `<style>` after: set the preload class to the dark base values directly.
3. `ThemeManager.init()` moves the class to `<body>` as `dark-mode`.

---

## Behaviour Layer

Isolated modules booted in order on `DOMContentLoaded`:

1. `ThemeManager` (first — prevents flash)
2. `IconsBootstrap` (stroke-width 1.5)
3. `OffcanvasManager`
4. `ModalManager`
5. `ScrollManager`

ThemeManager storage key: `headlessengineer-theme`. Dark class: `dark-mode`.
Fallback: `prefers-color-scheme`.

---

## Component Model

Each component is self-contained: own markup, scoped CSS, no cross-component
imports; shared patterns live in base.

Load order: **tokens → base → component → behaviour**. Must not change.
