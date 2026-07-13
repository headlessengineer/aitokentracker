---
name: component-build
description: Build a UI component from the headlessengineer design tokens (monochrome + one accent, AAA, rounded scale, Inter/JetBrains Mono/Bitcount). Use when creating or editing any UI component, button, card, nav, form control, or visual element. Source of truth is .claude/skills/design-system/.
---
# Component Build (design-system compliant)

Build accessible, on-brand components from tokens. **Read `.claude/skills/design-system/SKILL.md` first** —
it is the source of truth for color, type, spacing, radius, and rules.

## Procedure
1. Read `.claude/skills/design-system/SKILL.md`. Use semantic tokens only — never raw hex/px in the component.
2. Honor the constrained palette: neutral ramp + the single accent slot. Never a
   second hue. Accent is rationed (primary action, links, key figures, focus,
   active, one badge) and is fill/large/bold only - never small body text.
3. Status/feedback by **icon + shape + text**, never color alone.
4. Both light and dark must work (semantic-set swap); text meets **AAA**.
5. Radius from the rounded scale; spacing base-4; fonts by role (Bitcount =
   wordmark only, JetBrains Mono = code only, Inter = everything else).
6. Interaction: primary buttons use opacity states; ghost buttons invert neutral;
   links underline + fade; focus uses a visible `:focus-visible` outline.
7. Respect `prefers-reduced-motion`. Keyboard-operable; `aria-label` on icon-only
   controls; tap targets ≥ 48px.
8. Keep the component single-responsibility and prop-driven (SOLID/KISS).

## Verify before done
- No raw color/size literals · AAA contrast · works both themes · keyboard +
  focus visible · reduced-motion safe · accent not overused.
