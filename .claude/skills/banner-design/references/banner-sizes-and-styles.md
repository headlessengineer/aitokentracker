# Banner Sizes & Art Direction Styles

## Platform Sizes

### Social Media

| Platform | Type | Size (px) | Aspect |
|---|---|---|---|
| Facebook | Cover (desktop) | 820 × 312 | ~2.6:1 |
| Facebook | Cover (mobile) | 640 × 360 | 16:9 |
| Facebook | Event cover | 1920 × 1080 | 16:9 |
| Twitter/X | Header | 1500 × 500 | 3:1 |
| Twitter/X | Post | 1200 × 675 | 16:9 |
| LinkedIn | Company cover | 1128 × 191 | ~6:1 |
| LinkedIn | Personal banner | 1584 × 396 | 4:1 |
| YouTube | Channel art | 2560 × 1440 | 16:9 |
| YouTube | Safe area | 1546 × 423 | ~3.7:1 |
| Instagram | Stories / Reels | 1080 × 1920 | 9:16 |
| Instagram | Post | 1080 × 1080 | 1:1 |
| Instagram | Carousel | 1080 × 1350 | 4:5 |
| Pinterest | Pin | 1000 × 1500 | 2:3 |
| OG / Share | Standard | 1200 × 630 | ~1.9:1 |

### Web / Display Ads (Google Display Network)

| Name | Size (px) | Notes |
|---|---|---|
| Medium Rectangle | 300 × 250 | Highest CTR |
| Leaderboard | 728 × 90 | Top of page |
| Wide Skyscraper | 160 × 600 | Sidebar |
| Half Page | 300 × 600 | Premium |
| Billboard | 970 × 250 | Desktop hero |
| Mobile Banner | 320 × 50 | Mobile default |
| Large Mobile | 320 × 100 | Mobile hero |

### Website

| Type | Size (px) |
|---|---|
| Full-width hero | 1920 × 600–1080 |
| Section banner | 1200 × 400 |
| Blog / article OG | 1200 × 628 |
| Email header | 600 × 200 |

### Print

| Type | Size |
|---|---|
| Roll-up / pull-up | 850mm × 2000mm |
| Step-and-repeat | 8ft × 8ft |
| Vinyl outdoor | 6ft × 3ft |
| Trade show | 33in × 78in |

---

## Brand-Compatible Art Direction Styles

These 8 styles are compatible with the headlessengineer design system
(monochrome + one accent, borderless, no stray hues).

### 1. Minimalist
Clean, restrained, engineering-precise.
- Near-black or white surface; generous negative space
- Single focal element; Inter type only
- Accent appears on one element maximum (or not at all)
- **Not:** busy layouts, decorative fills, multiple weights

### 2. Bold Typography
Type IS the design — composition built entirely from Inter.
- Oversized `display` or `h1` letterforms fill the canvas
- One word or phrase set in `--primary` as the accent hit
- Background: `n-950` or `white`; no imagery
- **Use:** announcements, launch banners, quote cards

### 3. Duotone Photo
Photography treated to the brand's one-hue constraint.
- Photo converted to **duotone** (black→white) or **tritone** (black+`#009999`+white)
- Text overlaid on neutral surface strip or directly on the treated photo
- Never full-color photography; never stray hues from the image
- **Use:** article OG images, hero banners, editorial social posts

### 4. Editorial / Magazine
Grid-heavy, journalistic composition.
- Structured columns, pull quotes, ruled lines in `--border` (structural only, not decorative strokes)
- Inter in varied sizes/weights for visual hierarchy
- Accent on one pull-quote rule (2px `--primary` horizontal line) or single figure
- **Use:** thought leadership articles, report covers, LinkedIn posts

### 5. Geometric / Abstract
Mathematical precision as the primary visual element.
- Circles, rectangles, lines from the neutral ramp
- One geometric element (or the outline of one) in `--primary`
- Symmetric or grid-aligned; no organic shapes
- **Use:** tech announcements, fintech, system design content

### 6. Dark Moody
High-contrast, depth-forward, premium feel.
- `n-950` background; `n-900` / `n-800` layered surfaces for depth
- `fg` (white) for primary text; `fg-secondary` for supporting text
- Accent as a single glowing or solid element
- **Use:** premium content, event banners, case study cards

### 7. Data / Infographic
Stats and numbers as the visual hero.
- Large `display`-size metric in `--primary`
- Supporting numbers in `--fg`; labels in `--fg-secondary`
- Inline SVG charts if needed: primary series in `--primary`, others in neutral ramp steps
- **Use:** metrics announcements, annual review posts, benchmark results

### 8. Motion-Ready / Kinetic
Designed for animation; layered elements, loopable.
- Layers structured for CSS/JS animation (opacity, transform)
- Accent element animates; neutral foundation stays still
- **Static fallback required** — must read clearly without motion
- Honor `prefers-reduced-motion` (collapse all transitions to instant)

---

## Composition Principles

### Visual Hierarchy (3-Zone Rule)

| Zone | Content |
|---|---|
| Top | Wordmark or primary value proposition |
| Middle | Supporting message + visual |
| Bottom | CTA (button / URL / handle) |

### Safe Zones

- Critical content in central **70–80%** of canvas
- Avoid text/CTA within 50–100px of edges
- YouTube channel art: 1546 × 423px safe area inside 2560 × 1440
- Instagram/Facebook: central 80% to avoid platform UI chrome

### CTA Rules

- One CTA per banner
- High contrast vs background; use `--primary` fill + `--on-primary` label
- Bottom-right placement (terminal area)
- Min 48px height (touch target)
- Action verbs: "Read", "View", "Download", "Explore", "Book"

### Typography (Inter only)

| Element | Min Size (1080px canvas) | Weight |
|---|---|---|
| Headline | 48px | 700–900 |
| Subheadline | 28px | 600 |
| Body | 18px | 400 |
| Label / eyebrow | 14px | 600, +0.08em tracked |
| CTA | 16px | 600 |

Max 2 weights per banner. Headings uppercase with `letter-spacing: 0.1em` (brand convention).

### Print Specs

- 300 DPI minimum (150 DPI for large format ≥ 6ft)
- 3–5mm bleed all sides
- CMYK color mode; headlessengineer accent teal ≈ `C:100 M:0 Y:0 K:40`
- 1pt per foot viewing distance rule for type size

### Text-to-Image Ratio

- Display ads (Meta/Google): under 20% text
- Social covers: ~40% text, ~60% visual
- Print (3m+ distance): 70pt+ headlines
