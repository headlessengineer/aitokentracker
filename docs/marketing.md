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
- **Plugin architecture** — Claude Code works today; every other tool gets its own plugin
- **10 chart types** across models, agents, skills, tools, MCP servers, and hooks
- **ControlBar** — view selector + time range in one row; no sidebar needed
- **Time range filter** — 1D to 90D, URL-driven, shareable
- **Notifications** — OS-level browser alerts at 50%, 75%, and 100% of daily token limit; stays until dismissed
- **HEADLESSENGINEER wordmark** — Bitcount Grid Double variable font with Swap animation
- **Dark mode** — because you live in a terminal

---

## Live Demo: Overview

`http://localhost:3000/?days=30`

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADLESSENGINEER                             [☀] light/dark      │
│  AI Token Tracker                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [View: Overview ▾]   [Last 30 days ▾]                            │
├──────────────────────────────────────────────────────────────────┤
│  Total tokens      Conversations   Active tools   Last active     │
│  ─────────────     ─────────────   ────────────   ──────────      │
│  47.3M             1,247           1 / 6          2m ago          │
├──────────────────────────────────────────────────────────────────┤
│  [Token breakdown donut]     [Daily usage bar chart — 30 days]    │
│  [GitHub-style activity heatmap — full year]                      │
│  [Claude Code ✓]  [Codex — not configured]  [Cursor — not conf.]  │
│  [Windsurf ...]   [Copilot ...]             [Kiro ...]            │
└──────────────────────────────────────────────────────────────────┘
```

- Click any configured tool card → drill into its detail page
- Change view or time range without navigating: use the ControlBar dropdowns

---

## Live Demo: Claude Code Detail

`http://localhost:3000/claude?days=30`

Walk through top to bottom:

1. **ControlBar** — view selector + time range in one row
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

## Navigation: ControlBar

The sidebar was removed in favour of a single **ControlBar** row at the top of every page's content area:

```
[View: Overview ▾]   [Last 30 days ▾]
```

**View selector** — Overview and all registered plugins in one dropdown. Selecting a plugin navigates to `/${pluginId}?days=N`. Selecting Overview navigates to `/?days=N`. The current time range is preserved.

**Days selector** — 1D, 7D, 14D, 15D, 30D, 60D, 90D. Updates `?days=` in the current URL without changing the view. All charts and KPIs update on re-render.

The full viewport width is now available to charts and data tables — the old 240px sidebar column is gone.

---

## Plugin Architecture

Add any tool in 3 files.

```
src/plugins/
├── core/
│   ├── types.ts       ← TokenPlugin interface lives here
│   └── registry.ts    ← singleton, auto-wires to all routes + pages
├── claude/
│   ├── index.ts       ← ACTIVE: reads ~/.claude/**/*.jsonl
│   └── collector.ts   ← JSONL parser, hook reader
├── cursor/
│   └── index.ts       ← TODO: reads Cursor's storage
└── codex/
    └── index.ts       ← TODO: reads OpenAI usage export
```

```
TokenPlugin interface
├── id, name, icon, description, dataPath
├── isAvailable() → Promise<boolean>   // "is this tool installed?"
└── collect(options)  → Promise<PluginData>  // "give me the data"
```

One interface. One registration line. ControlBar, overview grid, API routes, and detail pages all update automatically.

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

`?days=1 | 7 | 14 | 15 | 30 | 60 | 90`

- URL-driven — bookmark any view, share with a teammate
- Server-side — filter change re-renders from data, not from a cached snapshot
- Affects **all** sections on the page: KPIs, charts, heatmap, models, projects, tools, sub-agents, skills, MCPs, conversation table
- Works on both overview (`/`) and every plugin detail page (`/claude`, `/cursor`, etc.)

```
[ 1D ]  [ 7D ]  [ 14D ]  [ 15D ]  [■30D■]  [ 60D ]  [ 90D ]
```

---

## Design System

UI is built on a strict token system — no hardcoded hex values anywhere.

- **Palette:** monochrome greyscale + one accent: `#009999` (teal)
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
| `useChartTheme` hook | ECharts SVG renderer cannot resolve CSS vars — hook reads `getComputedStyle(body)` |
| CSS Modules + custom properties | Design token enforcement; zero runtime overhead |
| TypeScript strict | `unknown` over `any`; explicit return types on all exports |
| Node.js `fs` (no ORM) | Data is local files — no DB needed or wanted |
| `next/font/local` | Self-hosted Bitcount Grid Double variable font — no external font request |
| No auth, no DB, no cloud | Local-first; your data never leaves your machine |

---

## What's Next

Immediate backlog:

- **Cost estimation** — map model × token counts to $/1K pricing tables; show spend alongside token counts
- **Real-time updates** — WebSocket or SSE to push new conversation activity without a page reload
- **Cursor plugin** — Cursor stores session data in `~/.cursor`; collector in progress
- **Windsurf plugin** — Codeium Windsurf; similar approach to Cursor
- **Copilot plugin** — GitHub Copilot telemetry via local VSCode extension storage

Longer term:

- Multi-user / team mode — aggregate across team members' machines via a shared collector
- Export — CSV / JSON export of aggregated stats for billing reconciliation

---

## How to Add Your Tool

Three steps, one interface.

**Step 1 — Create the plugin file**

```typescript
// src/plugins/mytool/index.ts
import type { TokenPlugin, PluginData } from '../core/types'

const MY_TOOL_PLUGIN: TokenPlugin = {
  id: 'mytool',
  name: 'My Tool',
  icon: 'MT',
  description: 'Tracks token usage from My Tool sessions',
  dataPath: path.join(os.homedir(), '.mytool', 'sessions'),
```

**Step 2 — Implement the interface**

```typescript
  async isAvailable() {
    return fs.existsSync(this.dataPath)
  },

  async collect(options = {}) {
    const { days = 30 } = options
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    // Read your tool's data files
    // Apply: if (record.date < since) continue  ← on ALL loops, not just one
    return { pluginId: 'mytool', summary: { ... }, collectedAt: new Date().toISOString() }
  },
}

export default MY_TOOL_PLUGIN
```

**Step 3 — Register it**

```typescript
// src/plugins/index.ts  — add one line:
import MY_TOOL_PLUGIN from './mytool'
registry.register(MY_TOOL_PLUGIN)
```

ControlBar, overview grid, API routes, and detail page all update automatically.

---

## Try It

```bash
git clone <repo>
npm install
npm run dev
# open http://localhost:3000
```

- Claude Code data appears immediately if `~/.claude/projects/` exists
- Other tools show "not configured" until their plugin is implemented
- Full developer guide: `docs/developer-guide.md`
- Architecture deep-dive: `docs/architecture.md`

**Contribute a plugin** — pick a tool, implement `TokenPlugin`, open a PR.
