---
name: a11y-audit
description: Accessibility audit against WCAG AAA and the design-system invariants. Use after building UI, before merging, or when the user asks about accessibility, contrast, keyboard, or screen-reader support. Reports issues; does not modify code.
---
# Accessibility Audit (WCAG AAA)

Audit UI for accessibility. **Report only.**

## Checklist
1. **Contrast (AAA):** body & secondary text ≥ 7:1; large/bold ≥ 4.5:1. Accent is
   large/bold/fill only. `fg-muted` for large/non-critical text only.
2. **Not color alone:** every status/state carries icon + shape + text.
3. **Keyboard:** all interactive elements reachable and operable; logical tab
   order; visible `:focus-visible` on every control; no focus traps (except modals
   that manage focus correctly).
4. **Semantics/ARIA:** correct landmarks/headings; icon-only buttons have
   `aria-label`; decorative marks `aria-hidden`; modals `role="dialog"` +
   `aria-modal` + labelled + focus return.
5. **Motion:** `prefers-reduced-motion` honored; nothing loops indefinitely.
6. **Targets:** label-less controls ≥ 48px both axes.
7. **Images/media:** meaningful `alt`; decorative images empty `alt`.

## Output
List failures by severity with element references and the fix. Do not edit files.
