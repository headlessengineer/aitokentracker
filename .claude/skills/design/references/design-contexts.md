# Design Contexts

The headlessengineer token system uses one neutral ramp and one accent. Different
contexts and industries are served not by changing colors but by changing density,
weight, and composition. This file shows how to shift the feel without introducing
new hues.

---

## Context Matrix

| Context | Spacing density | Type weight | Capitalization | Surface | Feel |
|---|---|---|---|---|---|
| **Corporate / consulting** | Loose (1.5× token) | Light–Regular | Title case | White | Authoritative, open |
| **Technical / engineering** | Tight (0.75× token) | Regular–Medium | Sentence case | Near-black | Precise, dense |
| **Premium / editorial** | Generous (2× token) | Thin–Light | Sparse uppercase | Near-black or white | Refined |
| **Bold / launch** | Compressed | Black–ExtraBold | ALL CAPS tracked | Near-black | High-energy |
| **Product / SaaS** | Standard | Regular–Semibold | Sentence case | White | Clean, functional |
| **Pitch / investor** | Moderate | Semibold–Bold | Title case | Dark bg | Confident |

---

## Corporate / Consulting

**Industries:** Management consulting, law, finance, B2B services  
**Strategy:**
- Large white/off-white surfaces; generous margins
- Light or regular weight body; semibold for section labels only
- Accent used only on one active/CTA element per page
- Dense text content is readable because spacing compensates

```css
/* Corporate feel */
.section { padding: calc(var(--spacing-section) * 1.5) var(--spacing-container); }
.body-text { font-weight: 400; line-height: 1.75; color: var(--fg); }
.label { font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.75rem; color: var(--fg-secondary); }
```

---

## Technical / Engineering

**Industries:** Developer tools, infrastructure, engineering platforms  
**Strategy:**
- Tight grid; information-dense layouts
- Monospace (`JetBrains Mono`) for any data, code, or metrics
- Lower accent usage; contrast achieved through weight and fill
- Tables, code blocks, and status indicators preferred over big type

```css
/* Technical feel */
.section { padding: var(--spacing-section) var(--spacing-container); }
.data-value { font-family: var(--font-mono); font-size: 0.875rem; color: var(--fg); }
.metric { font-weight: 700; font-size: 2rem; letter-spacing: -0.02em; }
```

---

## Premium / Editorial

**Industries:** Design agencies, luxury services, creative studios  
**Strategy:**
- Very generous whitespace — sections breathe
- Thin or light weight body; contrast from size not weight
- Display headlines at maximum scale; body text small
- Accent appears once, sparingly — often only in the wordmark

```css
/* Editorial feel */
.section { padding: calc(var(--spacing-section) * 2) var(--spacing-container); }
.display { font-size: var(--text-display); font-weight: 200; letter-spacing: -0.04em; line-height: 0.95; }
.body-text { font-size: 0.875rem; font-weight: 300; line-height: 1.8; max-width: 55ch; }
```

---

## Bold / Launch

**Industries:** Product launches, events, performance marketing  
**Strategy:**
- Black or ExtraBold weight; compressed leading
- ALL CAPS with tight tracking for headings
- Accent used more aggressively — fills, borders, glows
- Full-bleed dark sections

```css
/* Bold feel */
.headline { font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.9; }
.accent-fill { background: var(--primary); color: var(--on-primary); }
.section--dark { background: var(--bg-inverse); color: var(--fg-inverse); }
```

---

## Product / SaaS

**Industries:** Software products, apps, platforms  
**Strategy:**
- Standard token spacing — neither loose nor tight
- Regular/Medium weight; semibold for CTAs
- Clean white surface; cards for content grouping
- Accent on primary actions and active states only

```css
/* Product feel */
.section { padding: var(--spacing-section) var(--spacing-container); }
.card { background: var(--surface); border-radius: var(--rounded-md); padding: var(--spacing-4); }
.cta-primary { background: var(--primary); color: var(--on-primary); font-weight: 600; }
```

---

## Pitch / Investor

**Industries:** Startup pitches, fundraising, board presentations  
**Strategy:**
- Dark background (near-black) as default surface
- Semibold body; bold headlines; accent on key metrics
- Large numbers with tight tracking; tiny labels above
- One key stat per "hero" slide

```css
/* Pitch feel */
.slide { background: var(--bg-inverse); color: var(--fg-inverse); }
.big-metric { font-size: clamp(48px, 10vw, 120px); font-weight: 700; letter-spacing: -0.04em; color: var(--primary); }
.metric-label { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.6; }
```

---

## Rules That Never Change

Regardless of context:
- Only `#009999` or client's accent — no secondary accent
- Only Inter and JetBrains Mono — no decorative or display fonts
- No visible border strokes for surface division — use fill/spacing
- No gradients — contrast comes from opacity or fill
- `prefers-reduced-motion` respected in all animation
