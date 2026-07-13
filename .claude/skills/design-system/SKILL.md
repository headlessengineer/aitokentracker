---
name: design-system
description: headlessengineer design system — token architecture, color, typography, components, layout, dark mode, accessibility. Source of truth for all visual implementation. Use when building components, reviewing styling, or checking design rules. Tokens are normative; when prose and tokens disagree, tokens win.
argument-hint: "[tokens|color|typography|components|layout|invariants]"
metadata:
  author: headlessengineer
  version: "1.0.0"
---

# headlessengineer — Design System

Monochrome + one swappable accent. A fixed neutral ramp (black, white, greys) that
never changes, plus a single accent slot: `#009999` on our own properties, client's
color on client work. Equal light/dark pair. AAA text. No raw values in components.

For brand narrative (voice, positioning, logo rules), see the `brand` skill.

## When to Use

- Building or modifying any UI component
- Reviewing styling for token compliance
- Checking contrast, motion, or focus rules
- Implementing dark mode or an always-dark section
- Applying client theming (swapping the accent slot)

---

## Token Architecture

Two tiers on `:root`:

- **Tier 1 Primitives** — raw values named for what they *are* (`n-950`, `accent-brand`).
  Never referenced directly in components.
- **Tier 2 Semantics** — reference primitives, named for what they *do* (`bg`, `fg`,
  `primary`). Components consume **only** these.

For dark mode, only neutral semantics are overridden — the accent stays constant.
The accent slot (`primary`) is the one semantic that may be remapped per project.

Full token values → `references/tokens.md`

---

## Core Principles

1. **Constrained palette.** Fixed neutral ramp + exactly one accent slot. No other hues.
2. **Accent is rationed.** Primary action, logo, links, key figures, focus, active
   state, one badge. Never body text, large fills, or status. States use opacity, not shades.
3. **Token first.** No raw hex/px in component CSS. Chain: component → semantic → primitive.
4. **Accessible by construction.** Both themes AAA (7:1) for text. Meaning never
   carried by color alone. Focus always visible. Reduced motion honored.

---

## Design Invariants

These are hard rules. Every component and page must satisfy all of them.

1. **One accent slot, no other hues.** A second simultaneous hue is a violation.
2. **Neutrals never change.** Client theming swaps only `primary`/`on-primary`.
3. **Accent rationed & state-by-opacity.** Never body text, large fills, or status;
   states use opacity, not new shades.
4. **No raw values; neutrals from the ramp only.**
5. **Dark mode is a neutral-semantic swap;** the accent stays constant.
6. **AAA text.** `fg`/`fg-secondary` AAA; `fg-muted` large/non-critical; accent
   large/bold only.
7. **Status never by color** — icon + shape + text.
8. **Syntax highlighting is monochrome** — accent for keywords only.
9. **Imagery is grayscale, duotone, or tritone** — no stray hues.
10. **Logo is the constant brand** — wordmark-only, uppercase, two-tone (HEADLESS fg /
    ENGINEER accent); never lowercased, never reordered, never recolored to a client's
    accent in their product (monochrome there).
11. **Fonts by role only.** Bitcount = wordmark (uppercase), JetBrains Mono = code,
    Inter = everything else.
12. **Focus always visible; reduced motion honored.**
13. **Tap target ≥ 48px; correct hover by element type.**
14. **Transitions via pre-composed tokens;** the "Swap" signature is used once.
15. **Borderless.** No visible `border` strokes on components. Surfaces are
    differentiated by background fill only. `border-radius` and `border: none` resets
    are permitted; decorative strokes are not. `outline` is for focus rings only.
16. **Always-dark sections** use `background-color: var(--n-950)` (fixed primitive) +
    a `:global(body:not(.dark-mode))` local token remap. Headings on always-dark
    sections must declare `color: var(--fg)` explicitly.
17. **Card hover** is teal ambient glow: `box-shadow: 0 4px 24px rgba(0,153,153,0.18)`
    + `translateY(-2px)`. No background-only surface shift.

---

## Quick Token Reference

| Category | Key tokens |
|---|---|
| Accent | `primary` (#009999), `on-primary` (#fff), `accent-brand` (#009999) |
| Text (light) | `fg` #0a0a0a, `fg-secondary` #4d4d4d, `fg-muted` #808080 |
| Surface (light) | `bg` #fafafa, `surface` #fafafa, `surface-card` #fff, `elevated` #f2f2f2 |
| Text (dark) | `fg` #fff, `fg-secondary` #b3b3b3, `fg-muted` #808080 |
| Surface (dark) | `bg` #0a0a0a, `surface` #141414, `surface-card` #000, `elevated` #1f1f1f |
| Border | `border` #e0e0e0 (light) / #2e2e2e (dark) |
| Motion | fast 150ms, base 200ms, slow 300ms, ease-spring cubic-bezier(0.16,1,0.3,1) |
| Radius | sm 4px, md 8px, lg 12px, xl 16px, full 9999px |
| Spacing | 2xs 4, xs 8, sm 12, md 16, lg 24, xl 32, 2xl 40, 3xl 48, 4xl 64, 5xl 80 |

---

## References

| Topic | File |
|---|---|
| Full token YAML + semantic tables | `references/tokens.md` |
| Color, accessibility, client theming, data viz | `references/color.md` |
| Typography scale, heading hierarchy | `references/typography.md` |
| Components, interaction patterns, CTA | `references/components.md` |
| Layout, grid, dark mode, always-dark, responsive | `references/layout.md` |
