# HTML Slide Template

Complete HTML structure with headlessengineer tokens. All runtime (navigation,
theme toggle, scroll mode, offcanvas) is provided by `presentation.js` — include
that script once per deck. No inline scripts, no nav button HTML.

## Base Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Title</title>
    <style>
        /* ── Tier 1: primitives ──────────────────────────────────── */
        :root {
            --white:  #ffffff;
            --n-50:   #fafafa;
            --n-100:  #f2f2f2;
            --n-200:  #e0e0e0;
            --n-300:  #b3b3b3;
            --n-500:  #808080;
            --n-600:  #4d4d4d;
            --n-700:  #2e2e2e;
            --n-800:  #1f1f1f;
            --n-900:  #141414;
            --n-950:  #0a0a0a;
            --black:  #000000;
            --accent-brand: #009999;
        }

        /* ── Tier 2: semantics — LIGHT (default, matches globals.css) */
        :root {
            --bg:           var(--n-50);
            --surface:      var(--n-50);
            --surface-card: var(--white);
            --elevated:     var(--n-100);
            --border:       var(--n-200);
            --fg:           var(--n-950);
            --fg-secondary: var(--n-600);
            --fg-muted:     var(--n-500);   /* constant in both themes */
            --primary:      var(--accent-brand);
            --on-primary:   var(--white);
        }

        /* ── Tier 2: semantics — DARK (body.dark-mode, matches globals.css) */
        body.dark-mode {
            --bg:           var(--n-950);
            --surface:      var(--n-900);
            --surface-card: var(--black);
            --elevated:     var(--n-800);
            --border:       var(--n-700);
            --fg:           var(--white);
            --fg-secondary: var(--n-300);
            /* --fg-muted and --primary are constant */
        }

        /* ── Fonts ───────────────────────────────────────────────── */
        :root {
            --font-sans:     'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            --font-mono:     'JetBrains Mono', 'Fira Code', monospace;
            --font-wordmark: 'Bitcount Grid Double', var(--font-sans);
        }

        /* ── Spacing / radius ────────────────────────────────────── */
        :root {
            --r-sm: 4px;
            --r-md: 8px;
            --r-lg: 12px;
            --dur-fast: 150ms;
            --dur-base: 200ms;
            --dur-slow: 300ms;
            --ease-out:    ease-out;
            --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
            --size-touch: 48px;
            --pad: 56px;
        }

        /* ── Reset / base ────────────────────────────────────────── */
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: var(--bg);
            color: var(--fg);
            font-family: var(--font-sans);
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
            transition: background-color var(--dur-base) var(--ease-out),
                        color var(--dur-base) var(--ease-out);
        }
        body.scroll-mode { overflow-y: auto; }

        /* ── Deck container ──────────────────────────────────────── */
        .slide-deck {
            position: relative;
            width: 100vw; height: 100vh;
            overflow: hidden;
        }

        @media (min-width: 769px) {
            .slide-deck {
                max-width: calc(100vh * 16 / 9);
                max-height: calc(100vw * 9 / 16);
                margin: auto;
                position: absolute;
                inset: 0;
            }
        }

        /* Scroll mode overrides */
        body.scroll-mode .slide-deck {
            position: static; width: 100%; height: auto;
            max-width: none; max-height: none; overflow: visible;
        }
        body.scroll-mode .slide {
            position: relative; inset: unset;
            opacity: 1 !important; visibility: visible !important;
            min-height: 100svh; height: auto; transition: none;
        }

        /* ── Slide ───────────────────────────────────────────────── */
        .slide {
            position: absolute; inset: 0;
            display: flex; flex-direction: column;
            padding: var(--pad);
            opacity: 0; visibility: hidden;
            transition: opacity var(--dur-slow) var(--ease-out);
            background: var(--bg);
            overflow: hidden;
        }
        .slide.active { opacity: 1; visibility: visible; }

        /* ── Anatomy zones ───────────────────────────────────────── */
        .slide-header {
            flex-shrink: 0;
            display: flex; flex-direction: column;
            align-items: center; gap: 6px;
            padding-bottom: 20px;
        }
        .slide-header--left { align-items: flex-start; text-align: left; }

        .slide-body {
            flex: 1; width: 100%;
            display: flex; flex-direction: column;
            justify-content: center; gap: 16px;
            overflow: hidden; min-height: 0;
        }
        .slide-body--center { align-items: center; text-align: center; }

        .slide-footer {
            flex-shrink: 0;
            display: flex; justify-content: space-between; align-items: center;
            padding-top: 12px;
            /* no border — surfaces differ by fill only */
        }
        .footer-section {
            font-size: 12px; font-weight: 600;
            letter-spacing: 0.08em; text-transform: uppercase;
            color: var(--fg-muted);
        }
        .footer-wordmark {
            font-family: var(--font-wordmark);
            font-size: 13px; font-weight: 400;
            text-transform: uppercase; letter-spacing: 0.04em; line-height: 1;
        }
        .footer-wordmark .wm-head { color: var(--fg-muted); }
        .footer-wordmark .wm-eng  { color: var(--primary); }

        /* ── Typography ──────────────────────────────────────────── */
        .eyebrow {
            font-size: 0.72rem; font-weight: 600;
            letter-spacing: 0.14em; text-transform: uppercase;
            color: var(--primary);
        }
        .slide-title {
            font-size: clamp(30px, 5.8vw, 74px);
            font-weight: 700; letter-spacing: -0.02em;
            line-height: 1.04; text-transform: uppercase; color: var(--fg);
        }
        .section-title {
            font-size: clamp(22px, 3.2vw, 40px);
            font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; color: var(--fg);
        }
        .lead {
            font-size: clamp(15px, 2vw, 22px);
            color: var(--fg-secondary); line-height: 1.55;
        }
        p { font-size: clamp(13px, 1.6vw, 17px); color: var(--fg-secondary); line-height: 1.55; }

        /* ── Progress bar ────────────────────────────────────────── */
        .progress-bar {
            position: fixed; top: 0; left: 0; height: 3px;
            background: var(--primary); width: 0;
            transition: width var(--dur-base) var(--ease-out);
            z-index: 200;
        }

        /* ── Reduced motion ──────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
            .slide, .progress-bar { transition: none; }
        }
    </style>
</head>
<!-- Presentations default to dark-mode; presentation.js respects localStorage -->
<body class="dark-mode">
<div class="progress-bar" id="progressBar"></div>

<div class="slide-deck">

    <!-- data-slide-title  = shown in offcanvas navigator -->
    <!-- data-slide-section = section grouping shown above title in offcanvas -->
    <div class="slide active"
         data-slide-title="Title Slide"
         data-slide-section="">
        <div class="slide-header">
            <p class="eyebrow">Company / Context</p>
            <h1 class="slide-title">Headline</h1>
        </div>
        <div class="slide-body slide-body--center">
            <p class="lead">Subtitle or tagline</p>
        </div>
        <div class="slide-footer">
            <span class="footer-section">headlessengineer.xyz</span>
            <span class="footer-wordmark">
                <span class="wm-head">Headless</span><span class="wm-eng">Engineer</span>
            </span>
        </div>
    </div>

    <!-- Add more slides here — each needs data-slide-title -->

</div>

<!-- Shared presentation runtime: theme/scroll/offcanvas/navigation -->
<script src="./presentation.js"></script>
</body>
</html>
```

> **presentation.js is required.** It injects the offcanvas navigator, handles
> keyboard shortcuts, theme, and scroll mode. It expects `.slide` elements in a
> `.slide-deck` and a `#progressBar` element.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `← / →` | Previous / next slide (presentation mode) |
| `Space` | Next slide (presentation mode) |
| `T` | Toggle light / dark theme (persisted to localStorage) |
| `P` | Toggle presentation / scroll mode |
| `O` | Toggle offcanvas slide navigator |
| `Escape` | Close offcanvas |
| Click (non-button) | Next slide (presentation mode) |

## Chart.js Integration (npm — no CDN)

Install: `pnpm add chart.js`

In a Vite/Next.js project:
```javascript
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
```

For standalone HTML, copy `node_modules/chart.js/dist/chart.umd.min.js` locally:
```html
<script src="./chart.umd.min.js"></script>
```

Chart using headlessengineer tokens:
```html
<div class="chart-container" style="width: min(80%, 600px); height: clamp(200px, 40vh, 350px);">
    <canvas id="chart"></canvas>
</div>

<script>
new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            label: 'MRR ($K)',
            data: [5, 12, 28, 45],
            borderColor: '#009999',
            backgroundColor: 'rgba(0,153,153,0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#b3b3b3', font: { family: 'Inter' } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#b3b3b3', font: { family: 'Inter' } }
            }
        }
    }
});
</script>
```

## Animation Classes

```css
.animate-fade-up {
    animation: fadeUp 0.5s ease-out forwards;
    opacity: 0;
}
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}

.animate-scale {
    animation: scaleIn 0.4s ease-out forwards;
    opacity: 0;
}
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
}

.animate-stagger > * {
    opacity: 0;
    animation: fadeUp 0.4s ease-out forwards;
}
.animate-stagger > *:nth-child(1) { animation-delay: 0.08s; }
.animate-stagger > *:nth-child(2) { animation-delay: 0.16s; }
.animate-stagger > *:nth-child(3) { animation-delay: 0.24s; }
.animate-stagger > *:nth-child(4) { animation-delay: 0.32s; }
```

## Background Images (Grayscale / Duotone Only)

Use only grayscale or duotone-treated photographs — see `design-system/references/color.md` imagery rules.

```html
<div class="slide slide-with-bg" style="background-image: url('image.jpg')">
    <div class="overlay" style="background: rgba(10,10,10,0.80);"></div>
    <div class="slide-content" style="position: relative; z-index: 1;">
        <!-- Slide content -->
    </div>
</div>
```

## CSS Variables Reference

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#0a0a0a` | Slide background |
| `--surface` | `#141414` | Section / panel surfaces |
| `--surface-card` | `#000000` | Card and metric backgrounds |
| `--elevated` | `#1f1f1f` | Badge / pill backgrounds |
| `--border` | `#2e2e2e` | Table row separators only |
| `--fg` | `#ffffff` | Primary text |
| `--fg-secondary` | `#b3b3b3` | Secondary text, labels |
| `--fg-muted` | `#808080` | Muted text, footer labels (constant in both themes) |
| `--primary` | `#009999` | Accent: CTAs, highlights, chart lines, progress bar |
| `--on-primary` | `#ffffff` | Text on `--primary` fills |
