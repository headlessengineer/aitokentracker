# AI Token Tracker — Presentation

---

## AI TOKEN TRACKER

**HEADLESSENGINEER**

> *Know what your AI is spending.*

---

## The Problem

You're running six AI coding tools across your team.

- Claude Code, Cursor, Copilot, Windsurf — each with its own billing
- No single view of how many tokens you're burning or where
- Teams hit monthly limits without warning
- No visibility into which projects, models, or workflows are the most expensive
- Zero data on how sub-agents, skills, and MCP tools multiply your consumption

**You're flying blind on AI spend.**

---

## What We Built

A local-first dashboard that reads what your AI tools write to disk — no API key, no account, no data leaving your machine.

- **One URL** shows all your AI tool usage in one view
- **34 real integrations** — Claude Code, Codex, Cursor, Gemini, OpenCode, Amp, Cline, Roo Code, Goose, Zed, Windsurf, Kiro, Copilot, and 21 more
- **Live updates** — dashboard refreshes within 1–2 seconds of any AI tool write (chokidar + SSE)
- **Accurate cost across all tools** — LiteLLM pricing with 24h disk cache; not just Claude
- **Spending forecast** — "At this pace — $XX this month" on the Overview
- **Data export** — CSV or JSON via the Export button; your data, yours to keep
- **11 chart types** across models, agents, skills, tools, MCP servers, hooks, and hourly patterns
- **Draggable dashboard** — drag/resize every widget in Edit-layout mode; per-tool layouts persist locally
- **Off-canvas nav + ControlBar** — hamburger drawer switches tools; top row sets the time range; no fixed sidebar
- **Notifications** — daily digest + threshold alerts + rate limit warnings, all browser-native
- **Dark mode** — because you live in a terminal

---

## Live Demo: Overview

`http://localhost:9295/?days=30`

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADLESSENGINEER                    [☀] light/dark   [≡] tools   │
│  AI Token Tracker                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Last 30 days ▾]                          [⬇ Export]  [↻ Refresh]│
├──────────────────────────────────────────────────────────────────┤
│  Total tokens   Conversations  Active tools  Last active  Cost    │
│  47.3M          1,247          9 / 34        2m ago       $12.40  │
├──────────────────────────────────────────────────────────────────┤
│  Forecast: At this pace — $18.60 this month (15 days remaining)   │
├──────────────────────────────────────────────────────────────────┤
│  [Cross-tool stacked bar — all tools by day]                      │
│  [Unified project table — tokens + cost per repo across all tools]│
│  [Quota: Claude — 1,240 / 2,000 messages ████████░░ 62%]         │
├──────────────────────────────────────────────────────────────────┤
│  [Claude Code ✓] [Codex ✓] [Gemini ✓] [opencode ✓] [Cursor ✓] … │
└──────────────────────────────────────────────────────────────────┘
```

- Click any configured tool card → drill into its detail page
- Switch tools from the **≡ hamburger drawer** (top-right); change the time range from the ControlBar
- Drag/resize widgets in Edit-layout mode; reset layout from the same toggle

---

## Live Demo: Claude Code Detail

`http://localhost:9295/claude?days=30`

Walk through top to bottom:

1. **ControlBar** — time-range selector + Export button + refresh
2. **KPIs** — total tokens, conversations, unique tool calls, last activity, total cost, cache savings
3. **Token breakdown** — input vs output vs cache read vs cache write (donut)
4. **Daily usage** — bar chart, last N days
5. **Daily cost** — bar chart with secondary dashed "without cache" line
6. **Annual heatmap** — GitHub contribution graph, token intensity
7. **Hourly heatmap** — hour-of-day × day-of-week activity pattern (when you actually work)
8. **Models** — horizontal bar by token volume
9. **Model transition timeline** — stacked area chart; see when you shifted from claude-3.5-sonnet to claude-sonnet-4
10. **Sub-agents** — donut by `subagent_type` (fork, code-reviewer, Explore, etc.)
11. **Skills invoked** — bar chart by skill name
12. **MCP servers** — donut by server name
13. **Top tools** — all tool calls colour-coded by category (core / agent / skill / mcp)
14. **Hooks** — configured hook events + estimated fire counts
15. **Session duration** — histogram (< 5 min, 5–30 min, 30 min–2 hr, 2 hr+)
16. **Top projects** — token + cost by repo
17. **Recent conversations** — searchable table; arrow-key navigation; Enter expands token detail

---

## Navigation: OffcanvasNav + ControlBar

There is no fixed sidebar. Navigation is split across two controls:

**OffcanvasNav** — a hamburger button (`≡`, top-right of the TopBar) opens an off-canvas drawer listing **Overview + every registered plugin**. Available tools are highlighted; unavailable ones are dimmed with a reason (not installed / data path missing / parse error). Selecting one navigates to `/${pluginId}?days=N` (time range preserved). Closes on Esc or backdrop click, with full keyboard focus management.

**ControlBar** — a single row at the top of the content area:

```
[Today ▾]   [↻ Refresh]                              [⬇ Export]
```

**Days selector** — Today, 1D, 7D, 15D, 30D, 60D, 90D, All time. Updates `?days=` in the current URL. All charts and KPIs re-render server-side.

**Export button** — downloads `?format=csv` or `?format=json` for the current plugin and time window.

Splitting tool-switching (infrequent) from time-range + export controls (frequent) keeps the full viewport width available to charts and tables — no 240px sidebar column.

---

## Plugin Architecture

Add any tool in one file (plus one registration line). **34 plugins ship today, all real.**

```
src/plugins/
├── core/
│   ├── types.ts       ← TokenPlugin interface + shared data model + AvailabilityResult
│   ├── registry.ts    ← singleton; auto-wires caching + routes + pages for every plugin
│   └── collect.ts     ← shared helpers: buildPluginData, getCostUSD, globFiles…
├── claude/
│   ├── index.ts       ← RICH: reads ~/.claude/**/*.jsonl (tools, agents, skills, MCP, hooks, cost)
│   └── collector.ts   ← JSONL parser + hook reader
├── cursor/index.ts    ← reads Cursor usage CSV via API auth from state.vscdb
├── windsurf/index.ts  ← scans Windsurf globalStorage for Cline-style task files
├── codex/index.ts     ← OpenAI Codex delta-encoded sessions
├── goose/index.ts     ← SQLite via node:sqlite
└── … 28 more (JSONL / per-session JSON / SQLite / API-cached)
```

```
TokenPlugin interface
├── id, name, icon, description, dataPath
├── capabilities  → { cost, models, projects, sessions, rateLimit }
├── isAvailable() → Promise<AvailabilityResult>  // { available, reason?, detail? }
└── collect(options) → Promise<PluginData>        // give me the data
```

The registry wraps every plugin with a transparent SQLite cache (`~/.config/aitokentracker/cache.db`). Repeat reads cost < 5ms. Cache is invalidated by mtime — only plugins whose data files changed since the last collect re-read from disk.

---

## Personal Intelligence Features

Analytical views that no compared tool exposes in this form.

**Spending forecast** — trailing 7-day average × days remaining in the month. Visible the moment unified pricing is active (day one of use).

**Cross-tool aggregated timeline** — stacked bar on the Overview showing every tool's daily contribution. Answers "which tool am I using most this week, and is that trend changing?" at a glance.

**Cross-tool project attribution** — unified project table joins `topProjects[]` across every plugin. See the total AI cost for a single repo across Claude, Codex, Gemini, and Cursor in one row.

**Hourly activity heatmap** — 24 × 7 grid (hour × day-of-week). Surfaces work patterns the calendar view can't show.

**Cache ROI** — Claude plugin computes `savedUSD = cacheReadTokens × (inputRate − cacheReadRate)`. "Cache saved you $4.80 in this period" is a KPI card. The cost timeline shows a secondary "without cache" line for the same period.

**Model transition timeline** — stacked area chart of model share by day. See exactly when you migrated from claude-3.5-sonnet to claude-sonnet-4, and what that meant for cost.

**Conversation search** — live filter on the conversation table by project path or conversation ID; debounced 300ms; persisted to `?search=` for shareability.

**Keyboard navigation** — arrow keys move between table rows; Enter/Space expands a detail row showing the full token breakdown (input / output / cache read / cache write / created); Tab exits the table.

---

## Browser Notifications

Know before you hit the wall.

**Threshold alerts** — fire when today's token count crosses 50%, 75%, and 100% of the daily limit. Uses `requireInteraction: true` — stays in your tray until dismissed. Deduped per threshold per session.

**Rate limit warning** — fires when Claude's daily message count reaches ≥ 80% of the provider quota. Names the provider, count, and percentage in the notification body.

**Daily digest** — opt-in; fires once per calendar day with yesterday's total token count, total cost, and top tool by volume. Date-keyed dedup in `localStorage`.

**Quota progress bar** — always visible on the Overview when limit data is available: progress bar with colour coding (green → amber at 70% → red at 90%) and a reset countdown.

```
┌────────────────────────────────────────────────┐
│  AI Token Tracker                              │
│  Claude rate limit at 80%                      │
│  1,600 of 2,000 daily messages used.           │
│                                          [×]   │
└────────────────────────────────────────────────┘
```

Adding a new threshold or a new provider = one object in `rules.ts`. No other files change.

---

## Time Range Filter

`?days=0 | 1 | 7 | 15 | 30 | 60 | 90 | 9999`

- **Today** (`days=0`) — since midnight local time
- **All time** (`days=9999`) — no date gate; full history
- URL-driven — bookmark any view, share with a teammate
- Server-side — filter change re-renders from data, not a cached snapshot
- Affects **all** sections: KPIs, charts, heatmaps, models, projects, tools, sub-agents, skills, MCPs, conversation table

```
[Today] [ 1D ]  [ 7D ]  [ 15D ]  [■30D■]  [ 60D ]  [ 90D ]  [All time]
```

---

## Design System

UI is built on a strict token system — no hardcoded hex values anywhere.

- **Palette:** monochrome greyscale + one accent: `--primary` (teal, `#008383` in `globals.css`)
- **Accent rationing:** primary actions, active states, key data series, one badge type — never body text, large fills, or status colours
- **Surfaces:** differentiated by fill level (`--bg` → `--elevated` → `--surface-card`) — no border-bottom strokes
- **Typography:** Inter (UI), JetBrains Mono (code/numbers), Bitcount Grid Double (wordmark)
- **Font size scale:** 11px → 32px in 9 named steps
- **Motion:** `--ease-spring` for brand animations; `prefers-reduced-motion` always honoured

---

## Tech Stack

| Technology | Why |
|---|---|
| Next.js 16 App Router | Server components eliminate client/server data waterfalls |
| React 19 | Latest; no client state needed for data display |
| ECharts 6 | Calendar heatmap native support; React 19 compatible; SVG renderer |
| react-grid-layout 2.2.3 | Draggable/resizable widget dashboard; per-tool layouts persisted to `localStorage` |
| `node:sqlite` | Reads SQLite-backed tools (goose, zed, hermes, kilo, micode, opencode, antigravity, devin) with no extra dependency |
| chokidar | Filesystem watcher for live SSE push; singleton on `globalThis` survives hot reloads |
| `useChartTheme` hook | ECharts SVG renderer cannot resolve CSS vars — hook reads `getComputedStyle(body)` |
| CSS Modules + custom properties | Design token enforcement; zero runtime overhead |
| TypeScript strict | `unknown` over `any`; explicit return types on all exports |
| Node.js `fs` (no ORM) | Data is local files — no external DB needed or wanted |
| `next/font/local` | Self-hosted Bitcount Grid Double variable font — no external font request |
| No auth, no cloud | Local-first; your data never leaves your machine |

---

## How to Add Your Tool

Three steps, one interface.

**Step 1 — Create the plugin file**

```typescript
// src/plugins/mytool/index.ts
import path from 'path'
import os from 'os'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary, AvailabilityResult } from '../core/types'
import { buildPluginData, emptyPluginData, pathExists, convStatus, availResult } from '../core/collect'

const DATA_DIR = path.join(os.homedir(), '.mytool', 'sessions')

const MY_TOOL_PLUGIN: TokenPlugin = {
  id: 'mytool',
  name: 'My Tool',
  icon: 'MT',
  description: 'Tracks token usage from My Tool sessions',
  dataPath: DATA_DIR,
```

**Step 2 — Implement the interface**

```typescript
  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(DATA_DIR))
    // availResult(true)  → { available: true }
    // availResult(false) → { available: false, reason: 'path_missing' }
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    // Read your files, build a flat ConversationSummary[], apply the cutoff,
    // then let the shared helper fold it into a full PluginSummary — cost,
    // dailyCost, topModels, topProjects, hourlyActivity all computed automatically:
    const conversations: ConversationSummary[] = /* … parse DATA_DIR … */ []
    if (conversations.length === 0) return emptyPluginData('mytool')
    return buildPluginData('mytool', conversations, options)
  },
}

export default MY_TOOL_PLUGIN
```

> Need per-tool/agent/skill/MCP/hook breakdowns like Claude? Model your `collect()` on `src/plugins/claude/index.ts` instead of using `buildPluginData`.

**Step 3 — Register it**

```typescript
// src/plugins/index.ts — add two lines:
import MY_TOOL_PLUGIN from './mytool'
registry.register(MY_TOOL_PLUGIN)
```

The OffcanvasNav drawer, overview grid, API routes, cache layer, and detail page all update automatically.

---

## Try It

```bash
git clone <repo>
npm install
npm run dev
# open http://localhost:9295
```

- Claude Code data appears immediately if `~/.claude/projects/` exists
- All 34 integrations light up automatically once that tool's data files exist on disk
- Full developer guide: `docs/developer-guide.md`
- Architecture deep-dive: `docs/architecture.md`

**Contribute a plugin** — pick a tool, implement `TokenPlugin`, open a PR.
