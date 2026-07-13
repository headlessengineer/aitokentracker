---
name: banner-design
description: Design banners for social media, website heroes, and print — aligned to headlessengineer's monochrome+accent system. Neutral foundation, one teal accent (#009999), Inter typography. Art direction styles constrained to brand-compatible approaches. Use for social covers, OG images, hero sections, ad banners.
argument-hint: "[platform] [style] [dimensions]"
metadata:
  author: headlessengineer
  version: "1.0.0"
---

# Banner Design — headlessengineer

Multi-format banner design constrained to the headlessengineer design system: neutral
ramp + one teal accent, Inter typography, borderless surfaces, AAA contrast.

Brand source of truth: `.claude/skills/brand/SKILL.md` and `.claude/skills/design-system/SKILL.md`.

## When to Use

- Social media covers and headers
- OG / share images for articles and pages
- Website hero section visuals
- Ad banners (Google Display, LinkedIn, etc.)
- Event or print banners

---

## Design Constraints (Non-Negotiable)

1. **Colors:** neutral ramp only (`#ffffff` → `#000000`) + one accent `#009999`. No other hues.
2. **Typography:** Inter for all text. No other typeface except wordmark (Bitcount Grid Double, uppercase only).
3. **Accent rationed:** headline accent, one CTA, one badge, the wordmark's ENGINEER half — never background fills.
4. **Dark default:** social/OG/ad banners default to dark theme (`n-950` background).
5. **Imagery:** grayscale, duotone (black→white), or tritone (black+accent+white) only.
6. **Borderless:** surfaces differentiated by fill level, not strokes.
7. **Reduced motion:** any animated/kinetic variant must have a static fallback.

---

## Workflow

### Step 1: Gather Requirements

Collect:
1. **Purpose** — social cover, hero, ad banner, OG image, print?
2. **Platform / size** — which platform or custom dimensions?
3. **Content** — headline, subheadline, CTA, wordmark placement?
4. **Context** — our own brand, or client work (accent swap)?
5. **Art direction** — minimalist, bold type, editorial, duotone photo, geometric?
6. **Quantity** — how many variants?

### Step 2: Choose Art Direction

Select from the brand-compatible styles in `references/banner-sizes-and-styles.md`.
Pick 2–3 complementary directions for the same brief.

### Step 3: Build HTML/CSS Banner

- Use exact platform dimensions from the size reference.
- Critical content in central **70–80%** of canvas.
- Inline all CSS — self-contained file.
- Load Inter via `<link rel="preconnect">` + Google Fonts (or system stack for static).
- Apply headlessengineer tokens directly as CSS custom properties.

**Token quick reference for banners:**

```css
:root {
  /* Dark banner (default) */
  --bg: #0a0a0a;       /* n-950 */
  --surface: #141414;  /* n-900 */
  --fg: #ffffff;
  --fg-secondary: #b3b3b3;  /* n-300 */
  --primary: #009999;
  --on-primary: #ffffff;
  --border: #2e2e2e;   /* n-700 — structural use only */

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;

  /* Spacing */
  --sp-md: 16px;
  --sp-lg: 24px;
  --sp-xl: 32px;

  /* Radius */
  --r-md: 8px;
  --r-lg: 12px;
}
```

### Step 4: Export

Use Chrome headless at exact target dimensions:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" \
  --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size="${WIDTH},${HEIGHT}" \
  --virtual-time-budget=5000 \
  --screenshot="output/banner-name-${WIDTH}x${HEIGHT}.png" \
  "file:///path/to/banner.html"
```

Output naming: `{style}-{width}x{height}.png`

### Step 5: Present & Iterate

Show all variants. For each: art direction name, key design rationale, file path.

---

## Size Quick Reference

| Platform | Type | Size (px) | Aspect |
|---|---|---|---|
| Twitter/X | Header | 1500 × 500 | 3:1 |
| LinkedIn | Personal | 1584 × 396 | 4:1 |
| LinkedIn | Company | 1128 × 191 | ~6:1 |
| Facebook | Cover | 820 × 312 | ~2.6:1 |
| YouTube | Channel art | 2560 × 1440 | 16:9 |
| Instagram | Post | 1080 × 1080 | 1:1 |
| Instagram | Story | 1080 × 1920 | 9:16 |
| OG / Share | Standard | 1200 × 630 | ~1.9:1 |
| Google Ads | Leaderboard | 728 × 90 | 8:1 |
| Google Ads | Rectangle | 300 × 250 | 6:5 |
| Website | Hero | 1920 × 600–1080 | ~3:1 |

Full reference: `references/banner-sizes-and-styles.md`

---

## Brand-Compatible Art Styles

| Style | Best For | Accent Usage |
|---|---|---|
| **Minimalist** | SaaS, tech, consulting | Single accent element or none |
| **Bold Typography** | Announcements, quotes | Headline word in accent |
| **Duotone Photo** | Editorial, hero imagery | Photo treated black+accent+white |
| **Editorial / Magazine** | Thought leadership, articles | Accent on pull-quote or rule |
| **Geometric / Abstract** | Tech, fintech | Accent on one geometric element |
| **Dark Moody** | Premium, depth-forward | Accent punctuates one element |
| **Data / Infographic** | Stats, metrics | Accent on primary series only |
| **Motion-Ready / Kinetic** | Animated social | Accent animates; static fallback required |

---

## Composition Rules

- **3-Zone hierarchy:** top = wordmark or value prop; middle = supporting visual; bottom = CTA
- **Safe zone:** critical content in central 70–80% — avoid 50–100px from edges
- **One CTA** per banner, bottom-right preferred, min 48px height, action verb
- **Typography:** max 2 weights (regular + bold/black), min 16px body, ≥32px headline
- **Text density:** under 20% text area for display ads
- **Print:** 300 DPI, CMYK-safe neutrals, 3–5mm bleed

---

## Wordmark Placement

On our own properties: **HEADLESS** in `--fg`, **ENGINEER** in `--primary`.
On client banners: full wordmark in `--fg` (monochrome).
Minimum size: 16px tall. Clear space = cap-height on all sides.
