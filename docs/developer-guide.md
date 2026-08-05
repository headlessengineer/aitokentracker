# Developer Guide

Everything you need to build, extend, and debug AI Token Tracker.

> New to the codebase? Start with [`docs/project-understanding.md`](project-understanding.md) for a high-level orientation map, then come back here for the build/extend details.

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

Open `http://localhost:9295` (dev and prod both run on port 9295). If you have Claude Code installed, the Claude plugin auto-detects `~/.claude/projects` and renders your data immediately.

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
│   │   ├── index.ts                # Registers all 34 plugins
│   │   ├── core/
│   │   │   ├── types.ts            # Shared interfaces
│   │   │   ├── registry.ts         # PluginRegistry singleton
│   │   │   └── collect.ts          # Shared helpers (buildPluginData, globFiles, parseClaudeStyleJsonl, …)
│   │   ├── claude/                 # RICH reference plugin
│   │   │   ├── index.ts            # ClaudePlugin implementation
│   │   │   └── collector.ts        # Filesystem reader (tools/agents/skills/MCP/hooks/cost)
│   │   └── codex/ … zed/           # 33 more tool plugins, one dir each (lightweight)
│   ├── components/
│   │   ├── charts/
│   │   │   └── EChart.tsx          # ECharts React wrapper
│   │   ├── dashboard/              # KPICard, DashboardGrid, Section, ActivityHeatmap,
│   │   │                           #   TimelineChart, CostTimeline, ModelChart, ModelStackedChart,
│   │   │                           #   DurationHistogram, ToolCategoryDonut, TopToolsChart,
│   │   │                           #   SubAgentChart, SkillsChart, MCPChart, HooksPanel,
│   │   │                           #   ProjectTable, ConversationTable, TokenBreakdown,
│   │   │                           #   PluginBanner, PluginCard, NotificationEvaluator
│   │   ├── layout/
│   │   │   ├── Shell.tsx           # TopBar + full-width main (no sidebar)
│   │   │   ├── TopBar.tsx          # Wordmark + ThemeToggle + OffcanvasNav
│   │   │   ├── OffcanvasNav.tsx    # Hamburger drawer — tool switching lives here
│   │   │   ├── Wordmark.tsx        # HEADLESSENGINEER wordmark with Swap animation
│   │   │   ├── Footer.tsx
│   │   │   └── *.module.css
│   │   └── ui/
│   │       ├── ControlBar.tsx      # Time range <select> + optional action slot (client)
│   │       ├── RefreshButton.tsx
│   │       ├── AutoRefresh.tsx     # Periodic router.refresh() (used on detail page)
│   │       ├── Badge.tsx
│   │       ├── Skeleton.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── TimeRangeFilter.tsx # legacy / unused
│   ├── lib/
│   │   ├── format.ts
│   │   ├── useChartTheme.ts        # Resolves CSS tokens → hex for ECharts
│   │   └── notifications/
│   │       ├── types.ts            # NotificationRule, NotificationContext, NotificationSeverity
│   │       ├── rules.ts            # DAILY_TOKEN_LIMIT + DEFAULT_RULES
│   │       ├── manager.ts          # NotificationManager class
│   │       ├── useNotifications.ts # React hook
│   │       └── index.ts
│   └── types/
│       └── node-sqlite.d.ts        # Typings for the node:sqlite built-in
├── public/
│   └── fonts/
│       └── BitcountGridDouble-Variable.ttf
├── docs/
├── next.config.ts
├── tsconfig.json
└── package.json
```

> `src/plugins/devindesktop/` re-exports the `devin` plugin (which handles both CLI SQLite and Desktop NDJSON) and is registered. It is not a separate plugin — it is an alias entry point.

---

## Adding a New Plugin

### Two implementation flavors

There are exactly two ways a plugin is built. Pick the one that matches your tool's data:

- **Rich** — only `claude` (`src/plugins/claude/index.ts` + `collector.ts`). It reads `~/.claude/projects/**/*.jsonl` (including `<conv-id>/subagents/*.jsonl`), extracts every `tool_use` item, and builds the full `PluginSummary` **by hand**: `topTools` (categorized core/agent/skill/mcp/other), `subAgents` (from the Agent tool's `subagent_type`), `skills` (from the Skill tool's `skill` arg), `mcpServers` (`mcp__server__tool`), `hooks` (approximated from `~/.claude/settings.json[.local]` — Claude hooks leave no JSONL trace, so each hook's `matcher` is matched against recorded tool-call counts), plus per-entry `costUSD`.
- **Lightweight** — everything else (33 plugins). These build on the shared helpers in `src/plugins/core/collect.ts` and let `buildPluginData()` fold a flat `ConversationSummary[]` into a complete `PluginSummary`. `buildPluginData()` fills totals, daily buckets, project/model maps, and the sorted+sliced conversation list; it leaves the extended-breakdown arrays (`topTools`/`subAgents`/`skills`/`mcpServers`/`hooks`) **empty**, `dailyCost` empty, and `totalCostUSD` `0`.

Shared helpers in `core/collect.ts`:

| Helper | Purpose |
|---|---|
| `emptyUsage()` | A zeroed `TokenUsage` |
| `emptyPluginData(id)` | A zeroed `PluginData` (use as the "unavailable" return) |
| `convStatus(date)` | `'active' \| 'recent' \| 'inactive'` from a last-activity date |
| `pathExists(p)` / `statSync(p)` | Filesystem existence / safe stat |
| `globFiles(dir, ext)` | Recursive file walk |
| `parseClaudeStyleJsonl(raw)` | Parse Claude-shaped JSONL (`{type:'assistant', message:{usage, model}}`) |
| `buildPluginData(id, conversations, options?)` | Fold `ConversationSummary[]` → `PluginData` |

SQLite-backed plugins read via the built-in `node:sqlite` module (typed in `src/types/node-sqlite.d.ts`): `antigravity`, `devin`, `goose`, `hermes`, `kilo`, `micode`, `opencode`, `zed`. `codex` is a special case — it parses OpenAI Codex delta-encoded `token_count` events and dedupes `~/.codex/sessions` + `archived_sessions` (honouring the `CODEX_HOME` env var).

### Pick your starting point — clone an existing plugin

| Your tool's data looks like… | Clone / model on |
|---|---|
| Claude-style JSONL logs | `qwen` or `commandcode` (or `parseClaudeStyleJsonl` + `buildPluginData`) |
| Delta-encoded / custom JSONL | `codex` |
| Per-session JSON directory | `amp` or `mux` |
| SQLite database | `goose`, `zed`, or `hermes` (`node:sqlite`) |
| Rich tool/agent/skill/MCP/hook extraction | `claude` |

### Step 1 — Implement `TokenPlugin` (lightweight path)

The `TokenPlugin` interface (`src/plugins/core/types.ts`):

```typescript
interface TokenPlugin {
  readonly id: string
  readonly name: string
  readonly icon: string
  readonly description: string
  readonly dataPath: string
  isAvailable: () => Promise<boolean>
  collect: (options?: CollectOptions) => Promise<PluginData>
  getDashboardSections?: () => DashboardSection[]  // OPTIONAL — currently unused by every plugin/page (latent extension point)
}
```

`CollectOptions = { days?: number; limit?: number }` with defaults `days = 30`, `limit = 100`.

Create `src/plugins/<toolid>/index.ts`:

```typescript
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { buildPluginData, emptyPluginData, pathExists, convStatus } from '../core/collect'

const DATA_DIR = '/Users/<user>/.mytool/data'

const MY_PLUGIN: TokenPlugin = {
  id: 'mytool',
  name: 'My Tool',
  icon: 'M',
  description: 'Tracks token usage from My Tool sessions',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(DATA_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    if (!(await pathExists(DATA_DIR))) return emptyPluginData('mytool')

    const conversations: ConversationSummary[] = []
    // ...read + parse your tool's files, pushing one ConversationSummary per session:
    //   { id, project, messageCount, tokens, model, lastActivity, created,
    //     status: convStatus(lastActivity) }

    // buildPluginData fills totals, daily buckets, project/model maps, and the
    // conversation list. It respects options.limit; it does NOT date-filter —
    // pre-filter `conversations` by options.days yourself if you need it.
    return buildPluginData('mytool', conversations, options)
  },
}

export default MY_PLUGIN
```

**Why `buildPluginData()`?** `PluginSummary` has 16 required fields — `totalTokens`, `totalCostUSD`, `totalConversations`, `activeConversations`, `topProjects`, `topModels`, `dailyActivity`, `dailyCost`, `lastActivity`, `conversations`, `topTools`, `subAgents`, `skills`, `mcpServers`, `hooks`. Under TypeScript strict, **every one** must be present or it will not compile. Hand-building the object is error-prone (it is easy to forget `totalCostUSD` and `dailyCost`); let the helper do it.

For the **rich path**, skip `buildPluginData()` and construct the summary yourself — see `src/plugins/claude/index.ts` for the reference.

**Time-range note:** `buildPluginData()` does not apply the `days` cutoff. If your tool's records carry timestamps, filter your `conversations` array (or the raw records) by `options.days` before handing them over, otherwise the time-range dropdown will not affect this plugin.

### Step 2 — Register the plugin

In `src/plugins/index.ts`:

```typescript
import MY_PLUGIN from './mytool'
registry.register(MY_PLUGIN)
```

The OffcanvasNav drawer, overview page plugin cards, and all `/api/*` routes pick it up automatically.

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

### 3. Add it to the page's widget array

Pages no longer render `<Section>` blocks directly. Both `app/page.tsx` (overview) and `app/[pluginId]/page.tsx` (detail) build a `WidgetDef[]` and hand it to `<DashboardGrid>`. Widgets are built **conditionally** — only push a widget when it has data:

```typescript
// In src/app/[pluginId]/page.tsx (server component)
import { DashboardGrid, type WidgetDef } from '@/components/dashboard/DashboardGrid'
import MyChart from '@/components/dashboard/MyChart'

const widgets: WidgetDef[] = []

if (data.summary.myData.length > 0) {
  widgets.push({
    id: 'my-chart',
    content: <MyChart data={data.summary.myData} />,
    defaultPos: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
  })
}

// ...later in the JSX:
<DashboardGrid widgets={widgets} pluginId={pluginId} />
```

See [Dashboard Grid](#dashboard-grid) below for how positions, breakpoints, and persistence work.

---

## Dashboard Grid

`src/components/dashboard/DashboardGrid.tsx` (client) wraps **react-grid-layout** (the legacy build, `react-grid-layout/legacy`, package version `2.2.3`). Each page passes a `WidgetDef[]`:

```typescript
type WidgetDef = {
  id: string
  content: React.ReactNode
  defaultPos: { x: number; y: number; w: number; h: number; minW?: number; minH?: number }
}
```

Behaviour:

- An **"Edit layout"** toggle turns drag + resize on; **"Done editing"** turns it off. A **"Reset layout"** button appears in edit mode.
- Layouts persist **per-plugin** to `localStorage` under `aitokentracker-layout-<pluginId>` (the overview uses `pluginId="overview"`). Newly added widgets are merged into a saved layout (appended at the bottom); "Reset layout" clears the stored key.
- Responsive config: breakpoints `lg 1280 / md 768 / sm 480 / xs 0`, cols `12 / 12 / 6 / 4`, `rowHeight 80`.

Adding a chart therefore means adding a `WidgetDef` entry to the page's widget array — not rendering a component in the JSX tree directly.

---

## Time Range Filter

The time range is stored as a URL query parameter: `?days=N`. Selecting a new range from the ControlBar calls `router.push(path + '?days=' + N)`, which triggers a full server re-render.

Valid values are `VALID_DAYS = [0, 1, 7, 15, 30, 60, 90, 9999]` (defined in both `app/page.tsx` and `app/[pluginId]/page.tsx`); the default is `30`. `0` means "Today only"; `9999` means "All time". Any `?days=` value outside this set falls back to the default.

On the server, time range is read and validated via:

```typescript
const VALID_DAYS = [0, 1, 7, 15, 30, 60, 90, 9999] as const
const days = /* parsed from searchParams, clamped to VALID_DAYS, else 30 */ 30
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

Navigation and the time-range control are now **two separate components**. There is **no sidebar** and there is **no view selector** — tool switching lives in the off-canvas drawer.

### TopBar

`src/components/layout/TopBar.tsx` renders `Wordmark` + `ThemeToggle` + `OffcanvasNav`.

### OffcanvasNav — tool switching

`src/components/layout/OffcanvasNav.tsx` (`"use client"`) is a hamburger drawer. It lists **Overview** plus **every registered plugin** (unavailable ones dimmed). It handles ESC / backdrop close and focus management. **This is where a newly registered plugin appears in the navigation** — no other wiring is needed.

Props: `plugins: PluginStatus[]`, `activePluginId?: string`, `selectedDays: number`.

### ControlBar — time range + refresh

`src/components/ui/ControlBar.tsx` (`"use client"`) no longer has a view selector and no longer receives a `plugins` prop. Its current props are:

- `activePluginId?: string` — current plugin ID (undefined on overview); used to build the navigation target
- `selectedDays: number` — current days filter (from server-parsed searchParams)
- `dataPath?: string` — optional label shown on the right
- `action?: React.ReactNode` — optional slot (the detail page passes `<ExportButton days={days} pluginId={pluginId} />`)

It renders **one** time-range `<select>` (the `VALID_DAYS` options), plus an optional action slot and `dataPath` label. Changing the range calls `router.push(\`${path}?days=${value}\`)`. `useSearchParams` is not used — `selectedDays` is passed as a prop from the server-rendered parent.

### LiveUpdater

`RefreshButton` triggers a manual `router.refresh()`. The detail page (`app/[pluginId]/page.tsx`) also renders `<LiveUpdater />` — a client component that opens a connection to `GET /api/stream` (SSE backed by a chokidar watcher) and calls `router.refresh()` whenever a file-change event arrives. This replaces the old `<AutoRefresh intervalMs={5000} />` polling approach.

`GET /api/stream` emits `data: data-changed\n\n` whenever chokidar detects modifications in any plugin data path. `LiveUpdater` reconnects automatically on disconnect.

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
--accent-brand: #008383         /* The one accent primitive (fixed) */
--primary: var(--accent-brand)  /* Semantic accent — resolves to --accent-brand */
--primary-tint        /* color-mix(in srgb, var(--primary) 10%, transparent) */
--primary-tint-hover  /* color-mix(in srgb, var(--primary) 15%, transparent) */

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
--shadow-card-hover /* 0 4px 24px rgba(0, 131, 131,0.18) */

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
--max-width      /* 1280px */

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

1. **Monochrome + one accent.** `--accent-brand` (`#008383`) is the only non-greyscale colour.
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

Dark mode is a `dark-mode` class on `<body>` (selector `body.dark-mode`, **not** `.dark`). `ThemeToggle` (`src/components/ui/ThemeToggle.tsx`) toggles it via `document.body.classList.toggle('dark-mode', …)` and persists the choice to `localStorage` under `STORAGE_KEY = 'headlessengineer-theme'`. On first load, with no stored value it falls back to the `prefers-color-scheme: dark` media query.

Dark-mode overrides are defined under `body.dark-mode { ... }` in `globals.css`.

`useChartTheme` watches for class changes on `document.body` via a `MutationObserver` so charts re-resolve their token colours and re-render on toggle.

---

## API Routes

All routes export `export const dynamic = 'force-dynamic'` to prevent static caching. Most are GET; `cache/clear` is POST.

| Route | Method | Returns |
|---|---|---|
| `/api/plugins` | GET | `PluginStatus[]` |
| `/api/summary?days=N` | GET | Aggregated tokens + a `perPlugin` map across all available plugins |
| `/api/[pluginId]/data?days=N&limit=M` | GET | Full `PluginData` — `404` unknown, `503` unavailable, `500` error |
| `/api/cache/clear?pluginId=<id>` | POST | Force-invalidate the SQLite data cache for one (or all) plugins |
| `/api/export?days=N&format=csv\|json&plugins=all\|<id>` | GET | Download usage data as CSV or JSON attachment |
| `/api/stream` | GET (SSE) | Server-Sent Events; emits `data-changed` when chokidar detects file modifications |

> The pages do **not** call these routes. Both `app/page.tsx` and `app/[pluginId]/page.tsx` call the plugin registry directly server-side. The routes exist for external / programmatic use and for client-side components (`LiveUpdater`, `ExportButton`).

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
npm run dev    # Dev server at localhost:9295
npm run build  # Production build
npm run start  # Production server at localhost:9295
npm run lint   # ESLint check
```
