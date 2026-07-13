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

Open [http://localhost:3000](http://localhost:3000).

The overview dashboard loads immediately. If Claude Code is installed and has been used, token data populates automatically from `~/.claude/projects/`.

---

## Supported Tools

| Tool | Status | Data Source |
|---|---|---|
| Claude Code | **Active** | `~/.claude/projects/**/*.jsonl` |
| OpenAI Codex | Coming soon | — |
| Cursor | Coming soon | — |
| Windsurf | Coming soon | — |
| GitHub Copilot | Coming soon | — |
| Kiro | Coming soon | — |

Tools marked "Coming soon" appear in the UI as "Not configured" cards. They activate automatically once their plugin is implemented and their data path is available on the machine.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.10 (App Router) |
| Runtime | React 19, TypeScript (strict) |
| Charts | ECharts 6 (custom React wrapper, SVG renderer) |
| Styling | CSS Modules + CSS custom properties (no Tailwind) |
| Fonts | Inter (UI), JetBrains Mono (code) |
| Data | Local filesystem — no DB, no ORM |
| Auth | None |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx            # Overview dashboard
│   ├── [pluginId]/         # Per-tool detail page
│   └── api/                # Route handlers (plugins, summary, [pluginId]/data)
├── plugins/                # Plugin system
│   ├── core/               # TokenPlugin interface + registry
│   ├── claude/             # Claude Code plugin (active)
│   ├── codex/              # Placeholder
│   ├── cursor/             # Placeholder
│   ├── windsurf/           # Placeholder
│   ├── copilot/            # Placeholder
│   ├── kiro/               # Placeholder
│   └── index.ts            # Registers all plugins
├── components/
│   ├── layout/             # Shell, Sidebar, TopBar
│   ├── dashboard/          # KPICard, charts, tables, panels
│   ├── charts/             # EChart wrapper
│   └── ui/                 # Badge, Skeleton, ThemeToggle, TimeRangeFilter
└── lib/                    # format.ts utilities
```

---

## Adding a New Tool (Plugin)

**Step 1.** Create `src/plugins/<toolid>/index.ts`:

```typescript
import fs from 'fs'
import type { TokenPlugin, PluginData, CollectOptions } from '../core/types'

const MY_TOOL_PLUGIN: TokenPlugin = {
  id: 'mytool',
  name: 'My Tool',
  icon: 'MT',
  description: 'Tracks token usage from My Tool sessions',
  dataPath: '/path/to/mytool/data',

  async isAvailable() {
    return fs.existsSync(this.dataPath)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    // Read your tool's files and return a PluginData object
    // See src/plugins/claude/index.ts for a full example
  },
}

export default MY_TOOL_PLUGIN
```

**Step 2.** Register in `src/plugins/index.ts`:

```typescript
import MY_TOOL_PLUGIN from './mytool'
registry.register(MY_TOOL_PLUGIN)
```

**Step 3.** Run `npm run dev` — your tool appears in the sidebar and overview immediately.

See [`docs/developer-guide.md`](docs/developer-guide.md) for the full `PluginSummary` shape, chart configuration, and a Claude plugin walkthrough.

---

## Documentation

| Document | Description |
|---|---|
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
