# Layout Patterns

Slide layouts with CSS structures and animation classes.

## Layout Selection by Use Case

| Layout | Use Case | Animation |
|---|---|---|
| Title Slide | Opening / first impression | `animate-fade-up` |
| Problem Statement | Establish pain point | `animate-stagger` |
| Solution Overview | Introduce solution | `animate-scale` |
| Feature Grid | Show capabilities (3–6 cards) | `animate-stagger` |
| Metrics Dashboard | Display KPIs (3–4 metrics) | `animate-stagger` |
| Comparison Table | Compare options | `animate-fade-up` |
| Timeline Flow | Show progression | `animate-stagger` |
| Team Grid | Introduce people | `animate-stagger` |
| Quote Testimonial | Customer endorsement | `animate-fade-up` |
| Two Column Split | Compare / contrast | `animate-fade-up` |
| Big Number Hero | Single powerful metric | `animate-fade-up` |
| Product Screenshot | Show product UI | `animate-scale` |
| Pricing Cards | Present tiers | `animate-stagger` |
| CTA Closing | Drive action | `animate-fade-up` |

---

## CSS Structures

### Title Slide
```css
.slide-title-layout {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
}
```

### Two Column Split
```css
.slide-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
}
@media (max-width: 768px) {
    .slide-split { grid-template-columns: 1fr; gap: 24px; }
}
```

### Feature Grid (3 columns)
```css
.slide-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}
@media (max-width: 768px) {
    .slide-features { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}
@media (max-width: 480px) {
    .slide-features { grid-template-columns: 1fr; }
}
```

### Metrics Dashboard (4 columns)
```css
.slide-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}
@media (max-width: 768px) {
    .slide-metrics { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
    .slide-metrics { grid-template-columns: 1fr; }
}
```

---

## Component Variants

### Card Styles
| Style | CSS Class | Use For |
|---|---|---|
| Icon Left | `.card-icon-left` | Features with icons |
| Accent Bar | `.card-accent-bar` | Highlighted features |
| Metric Card | `.card-metric` | Numbers / stats |
| Avatar Card | `.card-avatar` | Team members |
| Pricing Card | `.card-pricing` | Price tiers |

### Metric Styles
| Style | CSS | When |
|---|---|---|
| `accent-number` | `color: var(--primary); font-weight: 700` | Headline metric |
| `oversized` | `font-size: clamp(80px,12vw,140px)` | Big hero stat |
| `sparkline` | Small inline SVG chart | Trend indicator |
| `funnel-numbers` | Decreasing sizes per stage | Conversion funnel |

---

## Visual Treatments

| Treatment | Implementation | When to Use |
|---|---|---|
| `accent-glow` | `box-shadow: 0 0 40px rgba(0,153,153,0.25)` | Title slides, CTAs |
| `surface-fill` | `background: var(--surface)` | Section differentiation (no borders) |
| `icon-top` | Icon above heading in card | Feature grids |
| `screenshot-shadow` | `box-shadow: 0 8px 40px rgba(0,0,0,0.5)` | Product screenshots |
| `popular-highlight` | `transform: scale(1.05)` | Pricing: recommended tier |
| `bg-overlay` | `rgba(10,10,10,0.80)` over image | Background image slides |
| `contrast-pair` | Side-by-side dark/light surfaces | Before / after |
| `logo-grayscale` | `filter: grayscale(1) brightness(2)` | Client logos on dark bg |

---

## Layout Decision Flow

```
1. What's the slide goal?
   └─> Choose from Layout Selection table

2. What's the emotional weight?
   ├─> Title / hero: large type + generous space
   ├─> Data / proof: tight grid + numbers
   └─> CTA: accent fill + centered

3. Does it need to break the pattern?
   └─> At 1/3 and 2/3 positions → use full-bleed dark slide
```
