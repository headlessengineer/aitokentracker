# Developer Guide

Everything you need to build, extend, and debug AI Token Tracker.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 20 | Runtime |
| npm | ≥ 10 | Package manager |
| Claude Code | any | Generates the data you track |

No database, no cloud account, no `.env` file required. The app reads your local `~/.claude/` directory.

---

## Quick Start

```bash
git clone <repo>
cd aitokentracker
npm install
npm run dev
```

Open `http://localhost:3000`. If you have Claude Code installed, the Claude plugin auto-detects `~/.claude/projects` and renders your data immediately.

---

## Repository Layout

```
aitokentracker/
├── src/
│   ├── app/                        # Next.js App Router pages & API routes
│   │   ├── globals.css             # Full design token system
│   │   ├── layout.tsx              # Fonts (Inter, JetBrains Mono, Bitcount) + root HTML
│   │   ├── page.tsx                # Overview dashboard (server component)
│   │   ├── page.module.css
│   │   ├── [pluginId]/
│   │   │   ├── page.tsx            # Per-plugin detail page (server component)
│   │   │   └── page.module.css
│   │   └── api/
│   │       ├── plugins/route.ts
│   │       ├── summary/route.ts
│   │       └── [pluginId]/data/route.ts
│   ├── plugins/
│   │   ├── index.ts                # Registers all plugins
│   │   ├── core/
│   │   │   ├── types.ts            # Shared interfaces
│   │   │   └── registry.ts         # PluginRegistry singleton
│   │   ├── claude/
│   │   │   ├── index.ts            # ClaudePlugin implementation
│   │   │   └── collector.ts        # Filesystem reader
│   │   ├── codex/index.ts          # Stub
│   │   ├── cursor/index.ts         # Stub
│   │   ├── windsurf/index.ts       # Stub
│   │   ├── copilot/index.ts        # Stub
│   │   ├── kiro/index.ts           # Stub
│   │   └── antigravity/index.ts    # Stub
│   ├── components/
│   │   ├── charts/
│   │   │   └── EChart.tsx          # ECharts React wrapper
│   │   ├── dashboard/              # KPICard, charts, tables, NotificationEvaluator…
│   │   ├── layout/
│   │   │   ├── Shell.tsx           # TopBar + full-width main (no sidebar)
│   │   │   ├── Shell.module.css
│   │   │   ├── TopBar.tsx
│   │   │   ├── TopBar.module.css
│   │   │   ├── Wordmark.tsx        # HEADLESSENGINEER wordmark with Swap animation
│   │   │   └── Wordmark.module.css
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── ControlBar.tsx      # View + time range dropdowns (client)
│   │       ├── ControlBar.module.css
│   │       ├── Skeleton.tsx
│   │       └── ThemeToggle.tsx
│   └── lib/
│       ├── format.ts
│       ├── useChartTheme.ts        # Resolves CSS tokens → hex for ECharts
│       └── notifications/
│           ├── types.ts            # NotificationRule, NotificationContext, NotificationSeverity
│           ├── rules.ts            # DAILY_TOKEN_LIMIT + DEFAULT_RULES
│           ├── manager.ts          # NotificationManager class
│           ├── useNotifications.ts # React hook
│           └── index.ts
├── public/
│   └── fonts/
│       └── BitcountGridDouble-Variable.ttf
├── docs/
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Adding a New Plugin

### Step 1 — Implement `TokenPlugin`

Create `src/plugins/<toolid>/index.ts`:

```typescript
import type { TokenPlugin, PluginData, CollectOptions } from '../core/types'

const MY_PLUGIN: TokenPlugin = {
  id: 'mytool',
  name: 'My Tool',
  icon: 'M',
  description: 'Tracks token usage from My Tool sessions',
  dataPath: '/Users/<user>/.mytool/data',

  async isAvailable(): Promise<boolean> {
    return fs.existsSync(this.dataPath)
  },

  async collect(options: CollectOptions = {}): Promise<PluginData> {
    const { days = 30 } = options
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Read your tool's data files here
    // Filter all records by: if (record.date < since) continue

    return {
      pluginId: 'mytool',
      summary: {
        totalTokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        totalConversations: 0,
        activeConversations: 0,
        topProjects: [],
        topModels: [],
        dailyActivity: [],
        lastActivity: null,
        conversations: [],
        topTools: [],
        subAgents: [],
        skills: [],
        mcpServers: [],
        hooks: [],
      },
      collectedAt: new Date().toISOString(),
    }
  },
}

export default MY_PLUGIN
```

**Critical:** Apply the `since` date gate at the top of every loop, not just one aggregation bucket. Forgetting this causes the time range dropdown to update only charts that explicitly filter themselves (daily activity) while all other charts show all-time data.

### Step 2 — Register the plugin

In `src/plugins/index.ts`:

```typescript
import MY_PLUGIN from './mytool'
registry.register(MY_PLUGIN)
```

The ControlBar view dropdown, overview page plugin cards, and all `/api/*` routes pick it up automatically.

---

## Adding a New Chart

### 1. Create the component

```typescript
// src/components/dashboard/MyChart.tsx
'use client'

import { useMemo } from 'react'
import EChart from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { SomeData } from '@/plugins/core/types'

interface Props {
  data: SomeData[]
}

export default function MyChart({ data }: Props) {
  const theme = useChartTheme()

  const option = useMemo(() => ({
    // Use theme.* values — never 'var(--*)' strings
    // ECharts SVG renderer cannot resolve CSS custom properties
    backgroundColor: theme.bg,
    textStyle: { color: theme.fg },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: { color: theme.primary },
    }],
    xAxis: {
      data: data.map(d => d.label),
      axisLabel: { color: theme.fgMuted },
      axisLine: { lineStyle: { color: theme.border } },
    },
    yAxis: {
      axisLabel: { color: theme.fgMuted },
      splitLine: { lineStyle: { color: theme.border } },
    },
  }), [data, theme])   // ← theme must be in the dep array

  return <EChart option={option} style={{ height: 280 }} />
}
```

### 2. Why `useChartTheme` — never `'var(--*)'`

ECharts uses an SVG renderer that constructs SVG attribute values directly. SVG attributes like `fill` and `stroke` do not inherit CSS custom properties from the document — they only accept resolved colour values. Passing `'var(--fg)'` results in:

```
echarts: 'var(--fg)' is an illegal color value, fallback to '#000000'
```

`useChartTheme` reads resolved values via `getComputedStyle(document.body)` and re-reads them whenever the dark-mode class is toggled on `<body>`.

### 3. Render in a page

```typescript
// In src/app/[pluginId]/page.tsx (server component)
import MyChart from '@/components/dashboard/MyChart'
import Section from '@/components/dashboard/Section'

// Inside the JSX:
<Section title="My Section">
  <MyChart data={data.summary.myData} />
</Section>
```

---

## Time Range Filter

The time range is stored as a URL query parameter: `?days=N`. Selecting a new range from the ControlBar calls `router.push(path + '?days=' + N)`, which triggers a full server re-render.

On the server, time range is read via:

```typescript
const days = Number(searchParams.days) || 30
const data = await plugin.collect({ days })
```

Inside your plugin's `collect()`, apply the cutoff at the entry point of the data loop:

```typescript
const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
for (const conv of rawConversations) {
  if (conv.lastModified < since) continue  // gate applies to ALL aggregations
  // ...
}
```

Do **not** apply the filter only to one bucket (e.g., `dailyActivity`). That causes all other charts to show all-time data regardless of the selected time range.

---

## Navigation and ControlBar

The `ControlBar` component (`src/components/ui/ControlBar.tsx`) is a `"use client"` component rendered as the first child in every page's content area. It replaces the former sidebar navigation.

It receives:
- `plugins: PluginStatus[]` — list of all registered plugins (builds the view dropdown)
- `activePluginId?: string` — current plugin ID (undefined for overview)
- `selectedDays: number` — current days filter (from server-parsed searchParams)

It renders two `<select>` dropdowns side by side:
- **View selector** — Overview + each plugin. Navigates to `/?days=N` or `/${pluginId}?days=N`
- **Days selector** — 1, 7, 14, 15, 30, 60, 90 days. Navigates to current path with new `?days=` value

Navigation uses `useRouter().push()`. `useSearchParams` is not used — `selectedDays` is passed as a prop from the server-rendered parent.

---

## Notification Rules

The notification system fires OS-level browser alerts when daily token usage crosses configured thresholds. All logic lives in `src/lib/notifications/`.

### How it works

On every page load:

1. The server computes `todayTokens` — the sum of `dailyActivity` entries for today's date.
2. The server renders `<NotificationEvaluator todayTokens={todayTokens} />` (renders `null`).
3. On the client, `useNotifications` calls `Notification.requestPermission()` then evaluates all rules against `NotificationContext`.
4. For each rule whose `check()` returns `true` and whose ID is not in `sessionStorage`, a browser `Notification` is created with `requireInteraction: true`.
5. The rule ID is written to `sessionStorage` (`aitokentracker:notif_fired`) so it does not fire again this session.

### NotificationContext fields

| Field | Type | Description |
|---|---|---|
| `dailyTokens` | `number` | Tokens consumed today (from `dailyActivity`) |
| `dailyLimit` | `number` | The configured daily ceiling (default: `DAILY_TOKEN_LIMIT = 50_000_000`) |
| `pctOfLimit` | `number` | `(dailyTokens / dailyLimit) * 100` |

### Adding a new rule

Edit `src/lib/notifications/rules.ts` — no other file needs to change:

```typescript
// src/lib/notifications/rules.ts
export const DEFAULT_RULES: NotificationRule[] = [
  // existing rules …
  {
    id: 'daily_usage_90pct',
    title: 'Token usage at 90%',
    body: (ctx) =>
      `${(ctx.dailyTokens / 1_000_000).toFixed(1)}M of ${(ctx.dailyLimit / 1_000_000).toFixed(0)}M used (${Math.round(ctx.pctOfLimit)}%).`,
    check: (ctx) => ctx.pctOfLimit >= 90 && ctx.pctOfLimit < 100,
    severity: 'critical',
  },
]
```

Rule IDs must be unique. The `severity` field is metadata for future use (e.g. icon selection, sound).

### Changing the daily limit

Update the constant in `rules.ts`:

```typescript
export const DAILY_TOKEN_LIMIT = 50_000_000  // change this value
```

### Programmatic use

`NotificationManager` can be instantiated with a custom rule set, useful for tests or per-plugin overrides:

```typescript
import { NotificationManager } from '@/lib/notifications'

const manager = new NotificationManager([myCustomRule])
const granted = await manager.requestPermission()
if (granted) manager.evaluate({ dailyTokens: 30_000_000, dailyLimit: 50_000_000, pctOfLimit: 60 })
```

`addRule(rule)` and `removeRule(id)` return `this` for chaining.

### Common pitfall

The browser prompts for notification permission on the first page load. If the user clicks "Block", `Notification.permission` becomes `'denied'` and `requestPermission()` returns `false` — the system silently does nothing. No error is thrown. To re-enable, the user must update browser site settings manually.

---

## Design System

All styling uses CSS custom properties defined in `src/app/globals.css`. Never use hardcoded hex colours, raw pixel values, or arbitrary font sizes.

### Token reference

```css
/* Colour */
--fg                  /* Primary text */
--fg-secondary        /* Secondary text */
--fg-muted            /* Disabled / placeholder */
--bg                  /* Page background */
--elevated            /* TopBar, card hover, select backgrounds */
--surface-card        /* Card surface */
--border              /* Dividers, input borders */
--primary: #009999    /* The one accent colour */
--primary-tint        /* rgba(0,153,153,0.1) */
--primary-tint-hover  /* rgba(0,153,153,0.15) */

/* Font size */
--font-size-2xs  /* 11px */
--font-size-xs   /* 12px */
--font-size-sm   /* 13px */
--font-size-md   /* 14px */
--font-size-base /* 15px */
--font-size-lg   /* 16px */
--font-size-xl   /* 18px */
--font-size-2xl  /* 24px */
--font-size-3xl  /* 32px */

/* Font weight */
--font-weight-normal    /* 400 */
--font-weight-medium    /* 500 */
--font-weight-semibold  /* 600 */
--font-weight-bold      /* 700 */
--font-weight-black     /* 900 */

/* Letter spacing */
--tracking-normal    /* 0.04em */
--tracking-wide      /* 0.06em */
--tracking-wider     /* 0.08em */
--tracking-widest    /* 0.12em */

/* Line height */
--line-height-tight    /* 1 */
--line-height-snug     /* 1.25 */
--line-height-normal   /* 1.4 */
--line-height-relaxed  /* 1.6 */

/* Spacing */
--space-2xs  /* 4px */
--space-xs   /* 6px */
--space-sm   /* 8px */
--space-md   /* 12px */
--space-lg   /* 16px */
--space-xl   /* 24px */
--space-2xl  /* 40px */

/* Border radius */
--radius-2xs  /* 2px */
--radius-xs   /* 4px */
--radius-sm   /* 6px */
--radius-md   /* 8px */
--radius-lg   /* 12px */
--radius-xl   /* 16px */
--radius-full /* 9999px */

/* Shadows */
--shadow-sm         /* 0 1px 4px rgba(0,0,0,0.08) */
--shadow-card-hover /* 0 4px 24px rgba(0,153,153,0.18) */

/* Component sizes */
--size-icon-btn  /* 36px */
--size-icon-sm   /* 16px */
--size-icon-md   /* 20px */
--size-icon-lg   /* 24px */
--size-icon-xl   /* 32px */
--size-swatch    /* 10px */

/* Opacity */
--opacity-dim     /* 0.3 */
--opacity-muted   /* 0.55 */
--opacity-subtle  /* 0.8 */

/* Typography */
--font-sans      /* var(--font-inter), system-ui, sans-serif */
--font-mono      /* var(--font-mono), JetBrains Mono, monospace */
--font-wordmark  /* var(--font-bitcount), 'Bitcount Grid Double', sans-serif */

/* Layout */
--topbar-height  /* 56px */
--max-width      /* 1400px */

/* Motion */
--duration-fast    /* 100ms */
--duration-default /* 200ms */
--duration-slow    /* 350ms */
--ease-default     /* cubic-bezier(0.4, 0, 0.2, 1) */
--ease-spring      /* cubic-bezier(0.34, 1.56, 0.64, 1) */

/* Z-index */
--z-raised  /* 10 */
--z-overlay /* 100 */
--z-modal   /* 1000 */
--z-topmost /* 9999 */
```

### Design invariants

1. **Monochrome + one accent.** `#009999` is the only non-greyscale colour.
2. **Borderless surfaces.** Differentiate fill levels by background colour — no border-bottom on the TopBar or surface edges.
3. **No hardcoded values.** Every dimension, colour, radius, font size, and spacing value must reference a token.
4. **`prefers-reduced-motion`** must be respected in any animation or transition.

---

## Font Setup

Three fonts are loaded in `src/app/layout.tsx`:

| Font | Variable | Purpose |
|---|---|---|
| Inter (Google Fonts) | `--font-inter` | Body / UI |
| JetBrains Mono (Google Fonts) | `--font-mono` | Code, token numbers |
| Bitcount Grid Double (local) | `--font-bitcount` | Wordmark only |

Bitcount Grid Double is a variable font served from `public/fonts/BitcountGridDouble-Variable.ttf`, loaded via `next/font/local` with `weight: '100 900'`. The CSS alias `--font-wordmark` falls back gracefully:

```css
--font-wordmark: var(--font-bitcount, 'Bitcount Grid Double', sans-serif);
```

---

## Wordmark Component

`src/components/layout/Wordmark.tsx` renders the HEADLESSENGINEER brand mark:

- `HEADLESS` in `var(--fg)`, `ENGINEER` in `var(--primary)`
- On hover, `ENGINEER` performs the "Swap" animation — pure CSS, no JavaScript
- Font: `var(--font-wordmark)`, 20px, weight 400
- `@media (prefers-reduced-motion: reduce)` disables all transitions

The component is a server component — no `useState`, no `useEffect`.

---

## Dark Mode

Dark mode is a `.dark` class on `<body>`. `ThemeToggle` adds/removes it with `localStorage` persistence.

Dark-mode overrides are defined under `.dark { ... }` in `globals.css`.

`useChartTheme` watches for class changes on `<body>` via `MutationObserver` so charts re-render with correct colours on toggle.

---

## API Routes

| Route | Returns |
|---|---|
| `GET /api/plugins` | `PluginStatus[]` |
| `GET /api/summary?days=N` | Aggregated summary across all available plugins |
| `GET /api/:pluginId/data?days=N` | Full `PluginData` for one plugin |

Each route exports `export const dynamic = 'force-dynamic'` to prevent static caching.

---

## Common Pitfalls

### ECharts illegal color

**Symptom:** `'var(--fg)' is an illegal color value, fallback to '#000000'`

**Fix:** Use `useChartTheme()` and pass `theme.*` hex values to ECharts options.

### Time range filter showing all-time data

**Symptom:** 1D/7D filter updates timeline and heatmap but not KPI cards, model breakdown, tools chart.

**Fix:** Place `if (conv.lastModified < since) continue` as the **first line** inside the main conversation loop — before all aggregation buckets.

### Hydration mismatch on `<body>`

**Symptom:** React hydration warning about unexpected attribute `cz-shortcut-listen`.

**Fix:** Already handled — `<body suppressHydrationWarning>` in `layout.tsx`. Do not remove it.

### Font not loading

**Symptom:** Wordmark renders in fallback sans-serif.

**Fix:** Ensure `public/fonts/BitcountGridDouble-Variable.ttf` exists.

---

## Scripts

```bash
npm run dev    # Dev server at localhost:3000
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint check
```
