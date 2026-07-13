---
name: design
description: headlessengineer design orchestration — routes to the right sub-skill for logo design, icon design, social photos, banners, slides, and client brand deliverables. All output constrained to monochrome + one accent (#009999), Inter typography, borderless surfaces. Use as the entry point for any design task not covered by brand, design-system, or component-build.
argument-hint: "[logo|icon|social|banner|slides|deliverables]"
metadata:
  author: headlessengineer
  version: "1.0.0"
---

# Design — headlessengineer

Entry point for design tasks. Routes to the appropriate sub-skill or reference.
All design output must satisfy the headlessengineer design system:
monochrome + one accent, Inter only, borderless, AAA contrast.

Source of truth: `.claude/skills/brand/SKILL.md` + `.claude/skills/design-system/SKILL.md`

## Sub-Skill Routing

| Task | Go to |
|---|---|
| Brand voice, positioning, copy review | `brand` skill |
| Token values, CSS variables, component specs | `design-system` skill |
| Building a UI component | `component-build` skill |
| Logo design (wordmark, client logos, SVG) | `references/logo-style-guide.md` |
| SVG icons | `references/icon-design.md` |
| Social media images / OG images | `references/social-photos-design.md` |
| Banners (social, ads, hero, print) | `banner-design` skill |
| HTML presentations / pitch decks | `slides` skill |
| Brand deliverables (business cards, signage, stationery) | `references/brand-deliverables.md` |
| Client accent color selection | `references/client-accent-selection.md` |
| AI image generation prompts | `references/ai-image-prompts.md` |

## Design Task Routing by Question

| Question | Skill / Reference |
|---|---|
| "What color should this be?" | `brand` |
| "Is this on-brand?" | `brand` |
| "What's the token for X?" | `design-system` |
| "Build me a button / card / nav" | `component-build` |
| "Design a logo for a client" | `references/logo-style-guide.md` |
| "Generate an icon" | `references/icon-design.md` |
| "Create an Instagram post" | `references/social-photos-design.md` |
| "Design a LinkedIn banner" | `banner-design` |
| "Build a pitch deck" | `slides` |
| "What accent color fits this client?" | `references/client-accent-selection.md` |
| "Create business card specs" | `references/brand-deliverables.md` |
| "Generate an AI image prompt" | `references/ai-image-prompts.md` |

---

## Design Invariants (Apply to All Output)

Every design artifact — regardless of medium — must satisfy these:

1. **One accent slot.** `#009999` on our properties. Client's color on client work. No second hue.
2. **Neutral ramp only** for all other color. No mid-tones outside the 12-step ramp.
3. **Inter** for all text. Bitcount Grid Double for the wordmark only. JetBrains Mono for code.
4. **Accent rationed:** primary action, wordmark, links, key figure, focus, active, one badge. Never body text or large fills.
5. **No visible border strokes.** Surfaces differentiated by fill level.
6. **AAA text contrast.** `fg`/`fg-secondary` on their respective backgrounds.
7. **Status without color.** Icon + shape + text.
8. **Imagery:** grayscale, duotone, or tritone only.
9. **Dark default** for presentations, social, OG. Light default for docs, email, proposals.
10. **Reduced motion honored** on all animated output.

---

## References

| Topic | File |
|---|---|
| Logo types, styles, scalability | `references/logo-style-guide.md` |
| Client accent color selection | `references/client-accent-selection.md` |
| AI image / mockup prompt engineering | `references/ai-image-prompts.md` |
| SVG icon design & specs | `references/icon-design.md` |
| Social / OG photo design | `references/social-photos-design.md` |
| Brand deliverables (physical + digital) | `references/brand-deliverables.md` |
| Design contexts (spacing/weight by industry) | `references/design-contexts.md` |
