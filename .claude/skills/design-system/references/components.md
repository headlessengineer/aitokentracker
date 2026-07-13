# Components

## Component Inventory

| Component | Group |
|---|---|
| Color (ramp + accent slot) | Foundations |
| Typography | Foundations |
| Logo & Wordmark | Foundations |
| Spacing Scale | Foundations |
| Buttons (primary, ghost, icon) | Primitives |
| Badges (accent, neutral) | Primitives |
| Code Block (monochrome syntax) | Primitives |
| Links | Primitives |
| Form Controls / Input | Inputs |
| Cards | Layout & Navigation |
| Navigation / Header | Layout & Navigation |
| Offcanvas Drawer | Layout & Navigation |
| Modal & Dialog | Layout & Navigation |
| Charts / Data Viz | Data Display |
| Status Indicators (shape + icon + text) | Feedback |

---

## Buttons

**Primary:** accent fill (`primary`), white label (`on-primary`), `md` radius (8px),
`12px 20px` padding. Hover: opacity 0.88. Active: opacity 0.76. One per view.

**Ghost:** transparent bg, `fg` text, `md` radius. Hover: invert to `fg` fill /
`bg` text (neutral — no accent, no border).

**Icon:** 48px square minimum, icon only, `aria-label` required.

---

## Links

**Global links:** `color: inherit`, no underline, uppercase.

**Prose body links** (`article a`): accent color, `text-transform: none`; hover
fades to `opacity-subtle` (0.8), underline persists.

**Nav links:** transition `fg-secondary` → `primary` on hover/active.

---

## Badges

**Accent badge:** `primary` bg, `on-primary` text, `sm` radius (4px).

**Neutral badge:** `bg` fill, `fg-secondary` text, `sm` radius (4px).

---

## Cards

Background: `surface-card`. Radius: `lg` (12px). Padding: 24px.

Hover (interactive cards only): `box-shadow: 0 4px 24px rgba(0,153,153,0.18)` +
`transform: translateY(-2px)`. No background-only surface shift.

---

## Input

Background: `surface`. Text: `fg`. Radius: `md` (8px). Padding: `10px 14px`.

---

## Navigation

Height: 64px. Background: `bg`. Item color: `fg-secondary`. Active: `primary`.

---

## Focus

Global `:focus-visible` on every interactive element: 2px solid `primary`,
small offset, matched radius. Never removed without a visible replacement.

---

## Code Block Visual Chrome

Every rendered code block gets macOS-style chrome: dots header + copy button.
Applied via `useEffect` in `ArticleContent` for markdown prose, and statically
composed in the `CodePanel` atom.

| Element | Value |
|---|---|
| Dots | 8×8px, `r-full`, `fg-muted`, gap 6px, opacity 0.6 |
| Copy button | Absolute top-right of `<pre>`, `fg-secondary` → `primary` on hover |
| `<pre>` | `elevated` bg, `r-lg` (12px), `sp-lg` (24px) padding, 14px/1.7 `font-code` |
| Inline `<code>` | `font-code`, 0.875em, `elevated` bg, `1px 4px` padding |

`ArticleContent.module.css` owns all `<pre>` / `<code>` styling for markdown prose.
`ContentDetail.module.css` does not duplicate these rules.

---

## Status Indicators (No Color)

No status colors. Success / warning / error / info are conveyed by
**icon + shape + text**, never hue:

| State | Encoding |
|---|---|
| Success | Check icon + text ("Passed") |
| Warning | Triangle icon + text ("Canary at 40%") |
| Error | Circle-x + text ("Region failed"), optional 2px `fg` left border |
| Active / deploying | Accent + text ("Deploying") — accent as the single active state |

Indicators use shapes (filled / ringed / hollow dot) plus a label; opacity may
reinforce but must never be the sole signal.

---

## CTA Design (Option B — Typographic Monument)

No containing card; typographic hierarchy only — oversized heading, teal rule,
centered buttons. All instances in an always-dark section.

| Element | Spec |
|---|---|
| Section | `n-950` always-dark + standard token remap |
| Heading | `font-size-hero` clamp(3rem–5rem), weight 900, `color: var(--fg)` |
| Teal rule | 60px wide × 2px tall, `background: var(--primary)`, `border: none` |
| Buttons | flex row, `gap: var(--sp-md)`, wrap, justify-center |

---

## Interaction Patterns

| Element | Hover |
|---|---|
| Primary button | Accent fill → opacity 0.88 |
| Ghost button | Invert to `fg` fill / `bg` text |
| Link | Fade to `opacity-subtle` (0.8), underline persists |
| Nav link | Color → `primary` |
| Card (interactive) | Teal ambient glow + lift |
