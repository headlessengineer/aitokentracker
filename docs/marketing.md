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
- **Plugin architecture** — **34 tools registered, 32 real integrations today** (Claude Code, Codex, Gemini, opencode, amp, cline, roocode, goose, zed, and more); cursor & windsurf are stubs awaiting data mapping
- **11 chart types** across models, agents, skills, tools, MCP servers, and hooks
- **Draggable dashboard** — drag/resize every widget in Edit-layout mode; per-tool layouts persist locally
- **Off-canvas nav + ControlBar** — a hamburger drawer switches tools; a top control row sets the time range; no fixed sidebar
- **Time range filter** — 1D to 90D, URL-driven, shareable
- **Notifications** — OS-level browser alerts at 50%, 75%, and 100% of daily token limit; stays until dismissed
- **HEADLESSENGINEER wordmark** — Bitcount Grid Double variable font with Swap animation
- **Dark mode** — because you live in a terminal

---

## Live Demo: Overview

`http://localhost:9295/?days=30`

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADLESSENGINEER                    [☀] light/dark   [≡] tools   │
│  AI Token Tracker                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [Last 30 days ▾]                                    [↻ Refresh]  │
├──────────────────────────────────────────────────────────────────┤
│  Total tokens   Conversations  Active tools  Last active  Cost    │
│  ────────────   ────────────   ───────────   ──────────   ────    │
│  47.3M          1,247          9 / 34        2m ago       $12.40  │
├──────────────────────────────────────────────────────────────────┤
│  [Token breakdown donut]     [Daily usage bar chart — 30 days]    │
│  [Daily cost line]           [GitHub-style activity heatmap]      │
│  [Claude Code ✓] [Codex ✓] [Gemini ✓] [opencode ✓] [amp ✓] …     │
│  [Cursor — not configured]   [Windsurf — not configured]  …       │
└──────────────────────────────────────────────────────────────────┘
```

- Click any configured tool card → drill into its detail page
- Switch tools from the **≡ hamburger drawer** (top-right); change the time range from the ControlBar; drag/resize widgets in Edit-layout mode

---

## Live Demo: Claude Code Detail

`http://localhost:9295/claude?days=30`

Walk through top to bottom:

1. **ControlBar** — time-range selector + refresh (switch tools from the ≡ drawer)
2. **KPIs** — total tokens, conversation count, unique tool calls, last activity
3. **Token breakdown** — input vs output vs cache read vs cache write (donut)
4. **Daily usage** — bar chart, last N days
5. **Annual heatmap** — GitHub contribution graph, token intensity
6. **Models** — horizontal bar, which Claude versions consumed what
7. **Sub-agents** — donut by `subagent_type` (fork, code-reviewer, Explore, etc.)
8. **Skills invoked** — bar chart by skill name (design-system, claude-api, etc.)
9. **MCP servers** — donut by server name
10. **Top tools** — all tool calls colour-coded by category (core / agent / skill / mcp)
11. **Hooks** — configured hook events + estimated fire counts
12. **Recent conversations** — table with project, model, tokens, status

---

## Navigation: OffcanvasNav + ControlBar

There is no fixed sidebar. Navigation is split across two controls:

**OffcanvasNav** — a hamburger button (`≡`, top-right of the TopBar) opens an off-canvas drawer listing **Overview + every registered plugin**. Available tools are highlighted; unavailable ones are dimmed. Selecting one navigates to `/${pluginId}?days=N` (time range preserved). Closes on Esc or backdrop click, with full keyboard focus management.

**ControlBar** — a single row at the top of the content area:

```
[Last 30 days ▾]                                    [↻ Refresh]
```

**Days selector** — 1D, 7D, 15D, 30D, 60D, 90D. Updates `?days=` in the current URL. All charts and KPIs re-render server-side.

Splitting tool-switching (infrequent) from the time-range control (frequent) keeps the full viewport width available to charts and tables — no 240px sidebar column.

---

## Plugin Architecture

Add any tool in one file (plus one registration line). **34 plugins ship today.**

```
src/plugins/
├── core/
│   ├── types.ts       ← TokenPlugin interface + shared data model
│   ├── registry.ts    ← singleton, auto-wires to all routes + pages
│   └── collect.ts     ← shared helpers: buildPluginData, parseClaudeStyleJsonl, globFiles…
├── claude/
│   ├── index.ts       ← RICH: reads ~/.claude/**/*.jsonl (tools, agents, skills, MCP, hooks, cost)
│   └── collector.ts   ← JSONL parser + hook reader
├── codex/index.ts     ← ACTIVE: OpenAI Codex delta-encoded sessions
├── goose/index.ts     ← ACTIVE: SQLite via node:sqlite
├── … 30 more active integrations (JSONL / per-session JSON / SQLite)
├── cursor/index.ts    ← stub (isAvailable → false)
└── windsurf/index.ts  ← stub (isAvailable → false)
```

```
TokenPlugin interface
├── id, name, icon, description, dataPath
├── isAvailable() → Promise<boolean>   // "is this tool installed?"
└── collect(options)  → Promise<PluginData>  // "give me the data"
```

Two ways to build one: use the shared `collect.ts` helpers (most tools) or write a rich collector like `claude`. One registration line and the OffcanvasNav, overview grid, API routes, and detail page all pick it up automatically.

---

## Browser Notifications

Know before you hit the wall.

- Rule-based engine fires OS-level alerts when daily usage crosses **50%**, **75%**, and **100%** of the 50M token daily limit
- Uses `requireInteraction: true` — alerts stay in your notification tray until you click ×
- `sessionStorage` deduplication: each threshold fires once per session, not once per page load
- Adding a new threshold = one object in `rules.ts`. No other files change.

```
┌────────────────────────────────────────────────┐
│  AI Token Tracker                              │
│  Token usage at 75%                            │
│  37.6M of 50M daily tokens used (75%).         │
│                                          [×]   │
└────────────────────────────────────────────────┘
```

---

## Time Range Filter

`?days=1 | 7 | 15 | 30 | 60 | 90`

- URL-driven — bookmark any view, share with a teammate
- Server-side — filter change re-renders from data, not from a cached snapshot
- Affects **all** sections on the page: KPIs, charts, heatmap, models, projects, tools, sub-agents, skills, MCPs, conversation table
- Works on both overview (`/`) and every plugin detail page (`/claude`, `/cursor`, etc.)

```
[ 1D ]  [ 7D ]  [ 15D ]  [■30D■]  [ 60D ]  [ 90D ]
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
| `useChartTheme` hook | ECharts SVG renderer cannot resolve CSS vars — hook reads `getComputedStyle(body)` |
| CSS Modules + custom properties | Design token enforcement; zero runtime overhead |
| TypeScript strict | `unknown` over `any`; explicit return types on all exports |
| Node.js `fs` (no ORM) | Data is local files — no DB needed or wanted |
| `next/font/local` | Self-hosted Bitcount Grid Double variable font — no external font request |
| No auth, no DB, no cloud | Local-first; your data never leaves your machine |

---

## What's Next

Immediate backlog:

- **Cost estimation everywhere** — Claude already reports `costUSD`; extend model × token → $/1K pricing to the other tools so every plugin shows spend
- **Real-time updates** — the detail page already auto-refreshes every 5s; move to WebSocket/SSE to push activity without a full re-render
- **Cursor plugin** — still a stub; Cursor stores session data locally and needs a collector
- **Windsurf plugin** — still a stub; similar approach to Cursor
- **Wire up `devindesktop`** — the plugin directory exists but isn't registered yet

Longer term:

- Multi-user / team mode — aggregate across team members' machines via a shared collector
- Export — CSV / JSON export of aggregated stats for billing reconciliation

---

## How to Add Your Tool

Three steps, one interface.

**Step 1 — Create the plugin file**

```typescript
// src/plugins/mytool/index.ts
import path from 'path'
import os from 'os'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { buildPluginData, emptyPluginData, pathExists, convStatus, globFiles } from '../core/collect'

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
  async isAvailable(): Promise<boolean> {
    return pathExists(DATA_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    // Read your files, build a flat ConversationSummary[] (apply the cutoff here),
    // then let the shared helper fold it into a full PluginSummary — no hand-rolling
    // the 16 required fields (totalCostUSD, dailyCost, topTools… all get set):
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
// src/plugins/index.ts  — add one line:
import MY_TOOL_PLUGIN from './mytool'
registry.register(MY_TOOL_PLUGIN)
```

The OffcanvasNav drawer, overview grid, API routes, and detail page all update automatically.

---

## Try It

```bash
git clone <repo>
npm install
npm run dev
# open http://localhost:9295
```

- Claude Code data appears immediately if `~/.claude/projects/` exists
- Any of the 32 real integrations light up automatically once that tool's data files exist
- Stubs (cursor, windsurf) show "not configured" until their collector is implemented
- Full developer guide: `docs/developer-guide.md`
- Architecture deep-dive: `docs/architecture.md`

**Contribute a plugin** — pick a tool, implement `TokenPlugin`, open a PR.
