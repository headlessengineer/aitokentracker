# AI Token Tracker

**Track token usage across every AI coding tool you use — in one place.**

AI Token Tracker is a self-hosted dashboard that reads local data files from your AI coding tools and shows you exactly how many tokens you are consuming, which models you are using, and where your usage is concentrated. No cloud sync, no API keys, no account required.

---

## Features

- **Unified overview** — aggregated token KPIs across all configured tools at a glance
- **Per-tool dashboards** — token breakdown, daily bar chart, annual heatmap, model usage, sub-agents, skills, MCP servers, top tools, hooks, top projects, and conversation table
- **Time range filter** — 1D / 7D / 15D / 30D / 60D / 90D on every view
- **Token type breakdown** — input, output, cache-read, and cache-write shown separately
- **Claude Code deep analytics** — sub-agent invocations by type, skill usage by name, MCP server calls, hook fire counts
- **Dark mode** — system-preference aware with manual toggle, persisted to localStorage
- **Plugin architecture** — add support for any new tool by implementing a single TypeScript interface
- **Zero infrastructure** — no database, no auth, no external services; reads local files at request time

---

## Quick Start

**Prerequisites:** Node.js 20+, Claude Code installed (for live data)

```bash
git clone https://github.com/popatkaran/aitokentracker.git
cd aitokentracker
npm install
npm run dev
```

Open [http://localhost:9295](http://localhost:9295).

The overview dashboard loads immediately. If Claude Code is installed and has been used, token data populates automatically from `~/.claude/projects/`.

---

## Supported Tools

**34 tool plugins are registered** (`src/plugins/index.ts`). Of these, **32 are real integrations** that read a live data path and detect their own availability, and **2 are placeholders** (`cursor`, `windsurf` — `isAvailable()` returns `false`, empty data path). Every registered tool appears in the off-canvas navigation drawer; tools with no data on the machine are shown dimmed as "not configured".

Claude Code is the deep-analytics reference integration:

| Tool | Level | Data Source |
|---|---|---|
| Claude Code | **Rich** (tools, sub-agents, skills, MCP servers, hooks, cost) | `~/.claude/projects/**/*.jsonl` |
| OpenAI Codex | Real — delta-encoded token-count sessions | `~/.codex/sessions` + `archived_sessions` |
| Qwen, CommandCode, … | Real — Claude-style JSONL logs | per-tool log dir |
| Amp, Mux, … | Real — per-session JSON directory | per-tool session dir |
| Goose, Zed, Hermes, Antigravity, Devin, Kilo, MiCode, OpenCode | Real — SQLite database (`node:sqlite`) | per-tool `.db` |
| Cursor, Windsurf | Placeholder — not yet implemented | — |

The remaining real integrations (Gemini, Copilot, Kiro, Cline, RooCode, KiloCode, Openclaw, Pi, Codebuddy, GJC, ZCode, OpenCodeReview, Kimi, Junie, Grok, JCode, Codebuff, Droid, Zed, and more) follow the same lightweight pattern. See `docs/developer-guide.md` for the full plugin authoring guide.

> Known gap: `src/plugins/devindesktop/` exists on disk but is **not** imported or registered in `src/plugins/index.ts`, so it does not appear in the app.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.10 (App Router) |
| Runtime | React 19.2.4, TypeScript 5 (strict) |
| Charts | ECharts 6.1.0 (custom React wrapper, SVG renderer) |
| Dashboard layout | react-grid-layout 2.2.3 (draggable / resizable widget grid) |
| Styling | CSS Modules + CSS custom properties (no Tailwind) |
| Fonts | Inter (UI), JetBrains Mono (code) |
| Data | Local filesystem — no DB, no ORM, no auth |
| Auth | None |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx            # Overview dashboard (builds WidgetDef[])
│   ├── [pluginId]/         # Per-tool detail page (builds WidgetDef[])
│   └── api/                # Route handlers (plugins, summary, [pluginId]/data)
├── plugins/                # Plugin system
│   ├── core/               # TokenPlugin interface, registry, shared collect.ts helpers
│   ├── claude/             # Rich reference plugin (index.ts + collector.ts)
│   ├── codex/ … zed/       # 34 tool plugins, one directory each
│   └── index.ts            # Registers all 34 plugins
├── components/
│   ├── layout/             # Shell, TopBar, OffcanvasNav, Wordmark, Footer
│   ├── dashboard/          # KPICard, DashboardGrid, charts, tables, panels
│   ├── charts/             # EChart wrapper
│   └── ui/                 # ControlBar, RefreshButton, AutoRefresh, Badge, Skeleton, ThemeToggle
├── lib/                    # format.ts, useChartTheme.ts, notifications/
└── types/                  # node-sqlite.d.ts (typings for node:sqlite)
```

---

## Adding a New Tool (Plugin)

Most tools are **lightweight** plugins: read your files into a flat `ConversationSummary[]`, then let the shared `buildPluginData()` helper fold it into a complete `PluginSummary` (totals, daily buckets, project/model maps, sorted conversations). This avoids hand-building the summary — every required field would otherwise have to be present or TypeScript strict fails to compile.

**Step 1.** Create `src/plugins/<toolid>/index.ts`:

```typescript
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { buildPluginData, emptyPluginData, pathExists, convStatus } from '../core/collect'

const DATA_DIR = '/path/to/mytool/data'

const MY_TOOL_PLUGIN: TokenPlugin = {
  id: 'mytool',
  name: 'My Tool',
  icon: 'MT',
  description: 'Tracks token usage from My Tool sessions',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(DATA_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    if (!(await pathExists(DATA_DIR))) return emptyPluginData('mytool')

    const conversations: ConversationSummary[] = [
      // ...map your parsed files into ConversationSummary objects
      // (use convStatus(lastActivity) for the status field)
    ]

    return buildPluginData('mytool', conversations, options)
  },
}

export default MY_TOOL_PLUGIN
```

For **rich** integrations (per-tool/agent/skill/MCP/hook breakdowns and per-entry cost), model your plugin on `src/plugins/claude/index.ts` + `collector.ts`, which build the full `PluginSummary` by hand.

**Step 2.** Register in `src/plugins/index.ts`:

```typescript
import MY_TOOL_PLUGIN from './mytool'
registry.register(MY_TOOL_PLUGIN)
```

**Step 3.** Run `npm run dev` — your tool appears in the off-canvas navigation drawer and overview immediately.

See [`docs/developer-guide.md`](docs/developer-guide.md) for the full `PluginSummary` shape, chart configuration, and a Claude plugin walkthrough.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/project-understanding.md`](docs/project-understanding.md) | **Start here** — orientation map of the whole codebase |
| [`docs/product-guide.md`](docs/product-guide.md) | Features, dashboard walkthrough, token type explainer, FAQ |
| [`docs/developer-guide.md`](docs/developer-guide.md) | Plugin interface, adding tools, configuring charts |
| [`docs/architecture.md`](docs/architecture.md) | System architecture with diagrams |
| [`docs/marketing.md`](docs/marketing.md) | Positioning, value proposition, presentation slides |

---

## Contributing

Pull requests welcome. Open an issue first for significant changes.

- TypeScript strict — no `any`, no non-null assertions without comment
- Design tokens only — no raw hex or px values in components
- No test-driven development required for plugins

---

## License

MIT

---

Built by [HEADLESSENGINEER](https://headlessengineer.com)
