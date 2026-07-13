# Social Photos Design Guide

Design social media images via HTML/CSS rendering + screenshot export. Read
`.claude/skills/brand/SKILL.md` and `.claude/skills/design-system/SKILL.md`
before designing — all output must use headlessengineer tokens.

## Platform Sizes

| Platform | Type | Size (px) | Aspect |
|---|---|---|---|
| Instagram | Post | 1080 × 1080 | 1:1 |
| Instagram | Story/Reel | 1080 × 1920 | 9:16 |
| Instagram | Carousel | 1080 × 1350 | 4:5 |
| Facebook | Post | 1200 × 630 | ~1.9:1 |
| Facebook | Story | 1080 × 1920 | 9:16 |
| Twitter/X | Post | 1200 × 675 | 16:9 |
| Twitter/X | Card | 800 × 418 | ~1.91:1 |
| LinkedIn | Post | 1200 × 627 | ~1.91:1 |
| LinkedIn | Article | 1200 × 644 | ~1.86:1 |
| Pinterest | Pin | 1000 × 1500 | 2:3 |
| YouTube | Thumbnail | 1280 × 720 | 16:9 |
| TikTok | Cover | 1080 × 1920 | 9:16 |
| Threads | Post | 1080 × 1080 | 1:1 |

---

## Workflow

### Step 1: Analyze Requirements

Parse the request for:
- **Subject/topic** — what the social photo represents
- **Target platforms** — which sizes needed (default: Instagram Post 1:1 + Story 9:16)
- **Content elements** — headline, subtext, CTA
- **Quantity** — how many variations (default: 2–3)

Read `.claude/skills/brand/SKILL.md` for voice/tone alignment. Read
`.claude/skills/design-system/references/tokens.md` for exact token values.

### Step 2: Generate Ideas

Create 2–3 concept ideas using only brand-compatible styles (see Art Direction table below).
Present to user for approval before building.

### Step 3: Design HTML Files

For each approved concept × target size, create a self-contained HTML file:

```
output/social-photos/
├── concept-1-instagram-post-1080x1080.html
├── concept-1-instagram-story-1080x1920.html
└── ...
```

#### HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width={WIDTH}, initial-scale=1.0">
  <style>
    :root {
      /* headlessengineer tokens — dark theme (exact globals.css values) */
      --bg:            #0a0a0a;
      --surface:       #141414;
      --surface-card:  #000000;
      --elevated:      #1f1f1f;
      --fg:            #ffffff;
      --fg-secondary:  #b3b3b3;
      --fg-muted:      #808080;
      --primary:       #009999;
      --on-primary:    #ffffff;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: {WIDTH}px;
      height: {HEIGHT}px;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--fg);
    }
    .canvas {
      width: {WIDTH}px;
      height: {HEIGHT}px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="canvas">
    <!-- Content here -->
  </div>
</body>
</html>
```

#### Design Rules

- **Self-contained** — inline all CSS; no external CDN calls
- **Inter only** — use system font stack fallback (`'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **Dark default** — `--bg: #0a0a0a`; light theme only if explicitly requested
- **No scrolling** — everything fits in one viewport
- **High contrast** — minimum 4.5:1 (WCAG AA) for all text
- **Safe zones** — critical content within central 80% area
- **One accent** — `#009999` is the only accent; use for one CTA or highlight element per image

#### Typography Reference (at 1080px width)

| Element | Min Size | Weight |
|---|---|---|
| Headline | 48px | 700–900 |
| Subheadline | 32px | 600 |
| Body | 24px | 400 |
| Caption | 18px | 400 |
| CTA | 28px | 700 |
| Label/eyebrow | 18px | 600, uppercase, tracked |

---

### Step 4: Screenshot Export

Always add a delay after page load for fonts to render.

#### Option A: Chrome Headless (zero dependencies)

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

"$CHROME" \
  --headless \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --window-size="${WIDTH},${HEIGHT}" \
  --virtual-time-budget=5000 \
  --screenshot="output.png" \
  "file:///path/to/file.html"
```

`--virtual-time-budget=5000` waits 5s virtual time for all assets to load before capture.

#### Option B: Playwright

```javascript
const { chromium } = require('playwright');

async function captureScreenshots(htmlFiles) {
  const browser = await chromium.launch();
  for (const file of htmlFiles) {
    const [width, height] = file.match(/(\d+)x(\d+)/).slice(1).map(Number);
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });
    await page.goto(`file://${file}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const out = file.replace('.html', '.png').replace('social-photos/', 'social-photos/exports/');
    await page.screenshot({ path: out, type: 'png' });
    await page.close();
  }
  await browser.close();
}
```

#### Option C: Puppeteer

```javascript
const puppeteer = require('puppeteer');

async function captureScreenshots(htmlFiles) {
  const browser = await puppeteer.launch();
  for (const file of htmlFiles) {
    const [width, height] = file.match(/(\d+)x(\d+)/).slice(1).map(Number);
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 }); // 2× retina
    await page.goto(`file://${file}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    const out = file.replace('.html', '.png').replace('social-photos/', 'social-photos/exports/');
    await page.screenshot({ path: out, type: 'png' });
    await page.close();
  }
  await browser.close();
}
```

### Step 5: Verify

Check each exported PNG:
- Fonts rendered (not falling back to system serif)
- Text readable at thumbnail size
- No overflow or clipping
- Safe zones respected
- Contrast ≥ 4.5:1 for all text
- No stray colors beyond neutral + `#009999`

---

## Art Direction Styles

Use only brand-compatible styles — no gradients, no glassmorphism, no multi-hue palettes.

| Style | Best For | Key Elements |
|---|---|---|
| **Minimalist** | SaaS, tech, consulting | Whitespace, single accent element, clean Inter |
| **Bold Typography** | Announcements, quotes | Large black/white type, high contrast, minimal imagery |
| **Duotone Photo** | Lifestyle, editorial | Grayscale or duotone image, text overlay |
| **Dark Moody** | Premium, agencies | Near-black bg, accent rule or glow, generous spacing |
| **Editorial** | Thought leadership | Mixed type scales, ruled sections, precise grid |
| **Data / Infographic** | Stats, metrics | Numbers as hero, monospace, tabular layout |
| **Geometric / Abstract** | Tech, abstract services | Neutral shapes, one accent shape, clean lines |
| **Motion-ready** | Story/Reel previews | Single strong focal point, text in safe zone |

Avoid: gradient-mesh, glassmorphism, 3D/isometric, multi-color palettes.

---

## Platform-Specific Tips

- **Instagram** — visual-first; minimal text (<20% area); strong composition
- **LinkedIn** — professional; data-driven; thought leadership tone
- **Twitter/X** — bold headlines; high contrast for dark/light mode
- **YouTube** — readable at 120×68px thumbnail; face close-ups perform well
- **Pinterest** — vertical; text overlay clear at small scale
- **TikTok** — bold, one clear message; text in safe zone (avoid top/bottom 200px)
