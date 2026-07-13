# Design Routing Reference

When to use each design skill or reference — updated for headlessengineer's skill set.

## Skills Overview

| Skill | Purpose |
|---|---|
| `brand` | Brand identity, voice, logo rules, color philosophy, client stance |
| `design-system` | Token values, CSS variables, component specs, invariants |
| `component-build` | Build UI components using design tokens |
| `design` | Routing hub + logo, icon, social, deliverables references |
| `banner-design` | Banners across social, ads, hero, print |
| `slides` | HTML presentations and pitch decks |

## Routing by Task

### Brand Identity
→ **brand** skill

- Define or review brand voice and copy
- Check logo usage or wordmark rules
- Apply or verify color philosophy
- Adapt brand for a client (accent swap)

### Design Tokens & Component Specs
→ **design-system** skill

- Look up any token value
- Check contrast ratios or accessibility rules
- Understand dark mode or always-dark section patterns
- Review component interaction specs

### UI Components
→ **component-build** skill

- Build buttons, cards, forms, nav, modals
- Implement dark mode for a component
- Review a component for token compliance

### Logo Design
→ `design/references/logo-style-guide.md` (type + aesthetic selection)
→ `design/references/client-accent-selection.md` (color for client logos)
→ `design/references/ai-image-prompts.md` (AI generation prompts)

- headlessengineer wordmark: already defined in `brand` skill — do not redesign
- Client logos: choose type + aesthetic from the style guide; align color to the client's accent slot

### Icon Design
→ `design/references/icon-design.md`

- Generate SVG icons inline (no AI scripts needed)
- `stroke-width: 1.5`, `currentColor`, `0 0 24 24` viewBox
- Style: `outlined` for UI, `filled` for nav/mobile, `sharp` for enterprise

### Social / OG Images
→ `design/references/social-photos-design.md`

- Instagram posts, Stories, Carousel
- Twitter/X, LinkedIn, Facebook, YouTube thumbnails
- OG share images for articles and pages

### Banners (Social Covers, Ads, Heroes, Print)
→ **banner-design** skill

- Social media covers and headers
- Display ad banners (Google, LinkedIn)
- Website hero visuals
- Print banners and roll-ups

### Presentations
→ **slides** skill

- Pitch decks, client proposals, talks
- Data slides with inline SVG charts
- Strategic decks (YC, Sales, QBR, etc.)

### Brand Deliverables (Physical + Digital Assets)
→ `design/references/brand-deliverables.md`

- Business cards, letterhead, stationery
- Email signatures
- Office signage, wayfinding
- Vehicle branding, apparel, promotional items

### AI Image Generation
→ `design/references/ai-image-prompts.md`

- Prompts for generating mockup photography
- Prompts for brand asset imagery
- Monochrome / duotone / tritone photography prompts

## Multi-Skill Workflows

### New Client Project
```
1. brand          → confirm accent slot for this client
2. design-system  → verify accent contrast on client's color
3. component-build → implement client-themed components
4. slides         → build client pitch or proposal deck
```

### Content Marketing Package
```
1. slides                 → build thought-leadership deck
2. banner-design          → social covers for all platforms
3. social-photos-design   → per-post graphics for the campaign
```

### Logo + Identity for Client
```
1. logo-style-guide       → choose logo type and aesthetic
2. client-accent-selection → select their accent color
3. ai-image-prompts       → generate mockup photography
4. brand-deliverables     → spec business card, letterhead, etc.
```
