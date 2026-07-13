# Client Accent Selection

When building a headlessengineer-powered product for a client, the neutral ramp
stays identical — only the `primary` accent slot is remapped to the client's brand
color. This guide covers how to choose or evaluate that color.

---

## The Constraint

The client's color must work in the accent slot:
- Used on fills, icons, large bold text, the active state, focus ring, one badge
- Must clear **AA contrast (4.5:1)** against `bg` (`#fafafa` light / `#0a0a0a` dark) for large/bold text
- Must clear **3:1** for UI components (buttons, icons) per WCAG 2.1 SC 1.4.11
- `on-primary` (label on a `primary`-filled button) must clear 3:1 — use white or black depending on luminance

## Quick Evaluation

Given a client's brand hex `$COLOR`:

1. Check against light bg (`#fafafa`): use a contrast checker
2. Check against dark bg (`#0a0a0a`): this is almost always higher contrast
3. If contrast on light bg < 3:1 (too light): use the color for fills only, not text; keep labels in `fg`
4. If contrast on light bg ≥ 3:1 but < 4.5:1: acceptable for UI components and large/bold text
5. Determine `on-primary`: white if client color is dark (luminance < 0.18); black if light

### Contrast Reference for Common Accent Ranges

| Accent character | On `#fafafa` (light bg) | Recommendation |
|---|---|---|
| Dark teal / navy (e.g. `#005577`) | High (≥7:1) | Excellent — use freely |
| Mid saturated (e.g. `#0077aa`) | ~5–7:1 | Good — use for text and fills |
| Bright/vivid (e.g. `#00aacc`) | ~3–4.5:1 | Use for fills and large text; not small text |
| Light/pastel (e.g. `#66cccc`) | <3:1 | Fills only; `fg` for all text |

---

## What Changes, What Doesn't

| Element | Our properties | Client's product |
|---|---|---|
| `--primary` | `#009999` | Client's brand color |
| `--on-primary` | `#ffffff` | Black or white — whichever clears 3:1 |
| `--accent-brand` | `#009999` (fixed) | `#009999` (fixed — our brand) |
| Neutral ramp | Unchanged | Unchanged |
| All neutral semantics | Unchanged | Unchanged |
| Syntax highlight color | `#009999` | Client's `primary` |
| Card hover glow | `rgba(0,153,153,0.18)` | `rgba(r,g,b,0.18)` of client's color |

---

## Monochromatic Accent Variants (For States)

The system has no tints or shades of the accent — states use opacity instead:

| State | CSS |
|---|---|
| Default | `background: var(--primary)` |
| Hover | `opacity: 0.88` |
| Active | `opacity: 0.76` |
| Disabled | `opacity: var(--opacity-dim)` (0.3) |

Do not add `primary-dark` or `primary-light` tokens. If a client requests a
secondary accent, explain the headless-color design argument and propose a
neutral-ramp differentiation strategy instead.

---

## Suggesting a Color to a Client

If a client doesn't have a defined brand color:

1. **Ask about their industry and positioning** — not to apply generic color theory
   directly, but to understand what contrast of personality they want vs. competitors
2. **Recommend a mid-dark saturated color** — avoids the contrast failures of pastels
   while providing personality
3. **Recommend one color** — the system is designed for exactly one; a second color
   is a design argument, not a missing feature
4. **Show it in context** — mock a button and a nav-active state before committing

### Psychology Notes (Applied to Single-Accent Systems)

These are tendencies, not rules — use as one input among many:

| Hue range | Association | Contrast tendency |
|---|---|---|
| Teal / cyan | Tech, clarity, precision | Mid — check per shade |
| Navy / deep blue | Trust, authority, finance | High — very readable |
| Deep green | Growth, sustainability, calm | High on light |
| Warm amber | Energy, approachability, optimism | Mid — check per shade |
| Deep purple | Premium, creative, sophisticated | High on light |
| Charcoal / near-black | Luxury, editorial, authority | Very high — reads as neutral |

Avoid for accent slots: pure red (status association conflicts with no-status-color rule),
pure yellow (poor contrast on white), pastels (fail contrast checks on light bg).
