# Project Understanding — AI Token Tracker

> **What this is.** A single, code-verified orientation map for the whole project: what it does, how it's built, how data flows, and where to change things. Read this first, then drop into the deeper docs ([`architecture.md`](architecture.md), [`developer-guide.md`](developer-guide.md), [`product-guide.md`](product-guide.md), [`client-data-sources.md`](client-data-sources.md)) for detail.
>
> **Verified against source on 2026-08-03.** Where the older docs disagree with the code, this file reflects the code. Divergences are called out in [§10 Known gaps & doc drift](#10-known-gaps--doc-drift).

---

## 1. What the product is

A **local-first, self-hosted dashboard** that reads the on-disk session/log files written by AI coding tools and shows unified token-usage analytics — how many tokens you burned, on which models, in which projects, with what tools/agents/skills/MCP servers, and (where the tool records it) cost.

- **No database, no auth, no cloud sync, no API keys.** Everything is read from the local filesystem at request time.
- **Plugin architecture.** Each AI tool is one plugin implementing a single TypeScript interface. Adding a tool = one file + one registration line.
- **Server-rendered.** Pages are React Server Components that call plugins directly; only interactive bits (charts, theme, nav, grid) are client components.

---

## 2. Current status snapshot (verified)

| Fact | Value |
|---|---|
| Framework | Next.js **16.2.10** (App Router) |
| Runtime | React **19.2.4**, TypeScript strict |
| Charts | ECharts **6.1.0** via a custom client wrapper (`EChart`), SVG renderer |
| Layout grid | `react-grid-layout` **2.2.3** (legacy build) — draggable/resizable widgets |
| Styling | CSS Modules + design-token custom properties (no Tailwind) |
| Dev server | `npm run dev` → **port 9295** (not 3000, despite the README) |
| Plugins registered | **34** in `src/plugins/index.ts` |
| Hard placeholders | **2** — `cursor`, `windsurf` (`isAvailable()` returns `false`, empty `dataPath`) |
| Real integrations | **32** — each has a real `dataPath` + existence check |
| On disk but NOT registered | `src/plugins/devindesktop/` exists but is never imported/registered |

**Plugin inventory (registered):** claude, codex, cursor*, windsurf*, copilot, kiro, gemini, antigravity, opencode, amp, roocode, cline, kilocode, hermes, goose, mux, qwen, openclaw, pi, commandcode, codebuddy, gjc, zcode, opencodereview, kimi, junie, grok, jcode, codebuff, droid, kilo, micode, zed, devin. `*` = placeholder.

---

## 3. Architecture at a glance

```
Browser ──▶ Next.js Server (RSC + Route Handlers) ──▶ Plugin Registry ──▶ Local filesystem
                     │                                       │              (~/.claude, ~/.codex,
                     │                                       │               sqlite DBs, jsonl logs …)
                     ▼                                       ▼
        HTML + serialized chart props           each plugin.collect() → PluginData
                     │
                     ▼
   Client components hydrate (ECharts, DashboardGrid, OffcanvasNav, ThemeToggle, notifications)
```

**Server/client boundary.** Pages, `Shell`, `TopBar`, `KPICard`, `Section`, tables, `HooksPanel` are Server Components. Client (`"use client"`) components: every chart (they touch the DOM + `getComputedStyle`), `DashboardGrid`, `OffcanvasNav`, `ControlBar`, `ThemeToggle`, `RefreshButton`, `AutoRefresh`, `NotificationEvaluator`.

**No caching by design.** Every request re-reads the filesystem (`export const dynamic = 'force-dynamic'` on all routes). Freshness over speed — acceptable for a local tool.

---

## 4. Request lifecycle

1. User loads `/` or `/<pluginId>` with an optional `?days=N` (valid: 1, 7, 15, 30, 60, 90; default 30).
2. The **page (RSC)** awaits `params`/`searchParams`, then calls the registry.
   - Overview `/` → `registry.getAll()`, filters by `isAvailable()`, `Promise.allSettled` over `collect({ days })`, merges results (aggregate tokens, merged daily activity + cost, per-plugin totals).
   - Detail `/<pluginId>` → `registry.get(id)`; if unavailable renders a "Not configured" banner; else `plugin.collect({ days })`.
3. The page builds a list of **widgets** (`WidgetDef[]`) conditionally (only widgets with data) and hands them to `<DashboardGrid>`.
4. HTML streams to the browser with chart data embedded as serialized props; client components hydrate.

There is also a parallel **JSON API** (`/api/*`) that returns the same data for programmatic/refresh use — see [§8](#8-api-routes).

---

## 5. Plugin system — the core abstraction

### Contract (`src/plugins/core/types.ts`)

```ts
interface TokenPlugin {
  readonly id: string          // url slug, registry key
  readonly name: string        // display name
  readonly icon: string        // short glyph, e.g. 'C', 'Cx'
  readonly description: string
  readonly dataPath: string    // shown in UI; '' for placeholders
  isAvailable(): Promise<boolean>
  collect(options?: CollectOptions): Promise<PluginData>   // { days?, limit? }
  getDashboardSections?(): DashboardSection[]              // optional, currently unused by pages
}
```

`collect()` returns a **`PluginData`** = `{ pluginId, collectedAt, summary: PluginSummary }`. The `summary` is the single normalized shape every chart/table consumes (tokens, cost, conversations, daily activity, daily cost, top projects/models, and the "extended breakdown": `topTools`, `subAgents`, `skills`, `mcpServers`, `hooks`).

### Registry (`src/plugins/core/registry.ts`)

A tiny singleton: `Map<id, TokenPlugin>` with `register` / `get` / `getAll`. `src/plugins/index.ts` imports every plugin and calls `registry.register(...)`; importing `@/plugins` gives the populated registry.

### Two implementation flavors

1. **Rich plugin — `claude`** (`src/plugins/claude/index.ts` + `collector.ts`).
   Its own filesystem reader walks `~/.claude/projects/**/*.jsonl` (including `<conv>/subagents/*.jsonl`), parses assistant messages for `usage`, and extracts **tool_use** items into: sub-agents (from `Agent` tool `subagent_type`), skills (from `Skill` tool `skill`), MCP servers (`mcp__server__tool`), and a categorized `topTools` list (`core`/`agent`/`skill`/`mcp`/`other`). Hooks are **approximated** from `~/.claude/settings.json[.local]` by matching each hook's `matcher` against recorded tool-call counts — Claude hooks leave no JSONL trace, so counts are estimates ("≈ N fires"). Also reads per-entry `costUSD`.

2. **Lightweight plugins** — everything else, built on shared helpers in `src/plugins/core/collect.ts`:
   - `parseClaudeStyleJsonl(raw)` — for tools that write Claude-shaped JSONL (`{ type:'assistant', message:{ usage, model } }`).
   - `globFiles(dir, ext)` — recursive file walk.
   - `buildPluginData(id, conversations[], opts)` — folds a flat `ConversationSummary[]` into a full `PluginSummary` (totals, daily buckets, project/model maps, sorted conversations). The extended-breakdown arrays are left empty for these.
   - `emptyPluginData(id)`, `emptyUsage()`, `convStatus(date)`, `pathExists`, `statSync`.
   Data sources vary widely by tool: JSONL logs, per-session dirs, and **SQLite DBs** (via `node:sqlite`, typed in `src/types/node-sqlite.d.ts`) for `antigravity, devin, goose, hermes, kilo, micode, opencode, zed`. `codex` is a notable special case: parses OpenAI Codex's delta-encoded `token_count` events and dedupes active vs `archived_sessions`.

---

## 6. Data model (normalized `PluginSummary`)

```
PluginData
 └─ summary: PluginSummary
      ├─ totalTokens: TokenUsage { input, output, cacheRead, cacheWrite, total }
      ├─ totalCostUSD, totalConversations, activeConversations, lastActivity
      ├─ topProjects:  ProjectStats[]        (name, tokens, conversations, lastActivity)
      ├─ topModels:    ModelStats[]          (model, tokens, tokensDetail, conversations)
      ├─ dailyActivity:DailyActivity[]       (date, tokens, input/output/cache, conversations)
      ├─ dailyCost:    DailyCost[]           (date, costUSD)
      ├─ conversations:ConversationSummary[] (id, project, messageCount, tokens, model,
      │                                        created, lastActivity, status)
      └─ extended breakdown:
           topTools:   ToolCallStats[]   (name, callCount, category)
           subAgents:  SubAgentStats[]   (type, invocations, conversations)
           skills:     SkillStats[]      (name, invocations, conversations)
           mcpServers: MCPServerStats[]  (server, callCount, tools[])
           hooks:      HookStats[]       (event, callCount)
```

Conversation `status` = `active` (<5 min) / `recent` (<1 hr) / `inactive` in the claude plugin; the shared `convStatus` helper uses a coarser <1 day / <7 day threshold.

---

## 7. UI & component layer

- **`Shell`** (server) → `TopBar` + full-width `main` + `Footer`. No fixed sidebar.
- **`TopBar`** → `Wordmark` + `ThemeToggle` + **`OffcanvasNav`** (client hamburger drawer listing Overview + every plugin, with unavailable ones dimmed; ESC/backdrop close, focus management).
- **`ControlBar`** (client) → time-range `<select>` (`?days=N` navigation) + optional action slot (`RefreshButton`) + data-path label.
- **`DashboardGrid`** (client, the big one) → wraps `react-grid-layout` `Responsive`. Pages pass `WidgetDef[]` (`{ id, content, defaultPos }`); the grid supports an **Edit layout** mode (drag/resize) and persists per-plugin layouts to `localStorage` under `aitokentracker-layout-<pluginId>`, merging in any newly-added widgets and offering **Reset layout**. Breakpoints lg/md/sm/xs, 12/12/6/4 cols.
- **Charts** (`src/components/dashboard/*`, all client) render via `<EChart>` and resolve design tokens to hex through **`useChartTheme()`** (`getComputedStyle(document.body)`), because ECharts can't read CSS custom properties. Set includes: `TokenBreakdown`, `TimelineChart`, `CostTimeline`, `ActivityHeatmap`, `ModelStackedChart`, `SubAgentChart`, `SkillsChart`, `MCPChart`, `TopToolsChart`, `ToolCategoryDonut`, `DurationHistogram`. Tables: `ConversationTable`, `ProjectTable`. Panels: `KPICard`, `HooksPanel`, `PluginCard`, `PluginBanner`, `Section`.
- **Notifications** (`src/lib/notifications/*` + `NotificationEvaluator`) — rule-based, browser-native `Notification` API. Server computes `todayTokens` and passes it to the client evaluator; a daily-token-limit rule fires an OS notification (deduped via `sessionStorage` + notification `tag`). Renders `null`.
- **`AutoRefresh`** (client) — on the detail page, re-fetches every 5 s.
- **Design system.** Monochrome neutral ramp + one accent — teal `--accent-brand: #008383` (`--primary` resolves to it), Inter (UI) / JetBrains Mono (code) / Bitcount (wordmark). Tokens live in `src/app/globals.css`; components use tokens only (no raw hex/px). See `.claude/skills/design-system/` for design rules.

---

## 8. API routes

All are `dynamic = 'force-dynamic'`, GET-only, return JSON.

| Route | Returns |
|---|---|
| `GET /api/plugins` | `PluginStatus[]` — id, name, icon, description, dataPath, `available` |
| `GET /api/summary?days=N` | Aggregated tokens + `perPlugin` map + `lastActivity` across all available plugins |
| `GET /api/[pluginId]/data?days=N&limit=M` | Full `PluginData` for one plugin (404 if unknown, 503 if unavailable, 500 on collect error) |

Note: the pages do **not** call these routes — they call the registry directly (server-side). The routes exist for external/programmatic consumers and client refresh.

---

## 9. Key files map

```
src/
├─ app/
│  ├─ page.tsx                     # Overview (RSC): aggregates all available plugins → widgets + tool cards
│  ├─ [pluginId]/page.tsx          # Detail (RSC): one plugin → KPIs + widget grid (or "Not configured")
│  ├─ layout.tsx, globals.css      # Root layout, fonts, full design-token system
│  └─ api/{plugins,summary,[pluginId]/data}/route.ts
├─ plugins/
│  ├─ index.ts                     # Registers all 34 plugins  ← add new plugin here
│  ├─ core/{types,registry,collect}.ts   # interface + singleton + shared collection helpers
│  ├─ claude/{index,collector}.ts  # the rich reference implementation
│  └─ <tool>/index.ts              # one per tool (jsonl / session-dir / sqlite readers)
├─ components/{layout,dashboard,charts,ui}/…
├─ lib/{format.ts,useChartTheme.ts,notifications/*}
└─ types/node-sqlite.d.ts          # types for node:sqlite (used by DB-backed plugins)
```

---

## 10. How to extend

**Add a tool plugin** (activates everywhere automatically — nav, overview card, detail page, `/api/[id]/data`):
1. Create `src/plugins/<toolid>/index.ts` implementing `TokenPlugin`. Reuse `core/collect.ts` helpers unless the tool needs rich tool/agent/skill extraction (then model it on `claude/`).
2. `import` + `registry.register(...)` in `src/plugins/index.ts`.
3. `npm run dev` (port 9295) — no other file changes needed.

**Add a chart:** create a `"use client"` component under `components/dashboard/`, take typed props from `core/types.ts`, resolve colors via `useChartTheme()`, render through `<EChart>`, then add a `WidgetDef` in the relevant page's widget array.

**Add an API route:** `src/app/api/<name>/route.ts`, export `async GET`, `import { registry } from '@/plugins'`, set `dynamic = 'force-dynamic'`.

---

## 11. Known gaps & doc drift

- **`docs/architecture.md` is partially stale.** It documents 6 plugins, a ControlBar-dropdown-only nav, and directly-rendered `<Section>`s. Reality: 34 plugins, an off-canvas hamburger nav (`OffcanvasNav`), and a draggable `DashboardGrid`. Its design-decision rationale (ADR-style) is still valuable and accurate.
- **`devindesktop` plugin is orphaned** — the directory exists but is never imported/registered in `index.ts`, so it never appears in the app.
- **README says port 3000; actual dev port is 9295** (`package.json` scripts). README also lists only 6 supported tools.
- **`cursor` and `windsurf` are still placeholders** — registered but `isAvailable()` hard-returns `false`.
- **Hook counts are approximations**, not measured (see [§5](#5-plugin-system--the-core-abstraction)).
- **`getDashboardSections?()`** exists on the interface but no plugin implements it and no page consumes it — a latent extension point.
- **No caching / linear cold-start** — every request re-reads the filesystem; large histories scale linearly.

---

## 12. Related documentation

| Doc | Purpose |
|---|---|
| [`architecture.md`](architecture.md) | Design rationale, Mermaid diagrams, ADR-style decisions (see drift note above) |
| [`developer-guide.md`](developer-guide.md) | Plugin interface deep-dive, adding tools, chart config |
| [`product-guide.md`](product-guide.md) | Feature walkthrough, token-type explainer, FAQ |
| [`client-data-sources.md`](client-data-sources.md) | Per-tool on-disk data locations & formats |
| [`marketing.md`](marketing.md) | Positioning & value proposition |
| `../README.md` | Quick start & top-level overview |
</content>
</invoke>
