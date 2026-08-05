---
name: project-aitokentracker
description: Architecture and status of the AI Token Tracker Next.js 16 app — plugin system, design tokens, current tool support
metadata:
  type: project
---

Multi-tool AI token tracker built in Next.js 16 App Router (src/app). Plugin architecture where each AI coding tool is a plugin.

**Why:** User wants a unified dashboard to track token usage across Claude Code, Codex, Cursor, Windsurf, Copilot, Kiro — extensible when new tools emerge.

**How to apply:** When adding a new tool, create `src/plugins/<toolid>/index.ts` implementing `TokenPlugin` interface, register in `src/plugins/index.ts`. No changes needed elsewhere for basic support.

## Architecture

- `src/plugins/core/types.ts` — `TokenPlugin` interface, `TokenUsage`, `ConversationSummary`, `PluginData` types
- `src/plugins/core/registry.ts` — singleton `registry.register()` / `registry.get()` / `registry.getAll()`
- `src/plugins/<id>/index.ts` — one file per tool implementing `TokenPlugin`
- `src/plugins/index.ts` — registers all plugins; import this to get the populated registry

## Active Plugins (as of 2026-08-05)

- **34 plugins registered** in `src/plugins/index.ts`. All 34 are real integrations — there are **no hard placeholders**.
- **claude** — rich reference impl (own `collector.ts`; extracts tools/sub-agents/skills/MCP/hooks/cost from `~/.claude/projects/**/*.jsonl`).
- **~32 standard integrations** — each has a real `dataPath` + `isAvailable` check. Flavors: JSONL/session-dir readers using shared `core/collect.ts` helpers, and SQLite-backed readers via `node:sqlite` (antigravity, devin, goose, hermes, kilo, micode, opencode, zed).
- **cursor** — real implementation: reads Cursor usage CSV via API auth from `state.vscdb`; manages its own 1-hour CSV cache.
- **windsurf** — real implementation: scans Windsurf globalStorage for Cline-style `ui_messages.json` task files.
- **devin** — handles both CLI SQLite and Desktop NDJSON. `devindesktop/` re-exports it and is registered.

See `docs/project-understanding.md` for the full code-verified orientation map.

## Routes

- `GET /api/plugins` — list all plugins with availability
- `GET /api/summary?days=N` — aggregated tokens across all available plugins
- `GET /api/[pluginId]/data?days=N&limit=N` — per-plugin detailed data
- `POST /api/cache/clear?pluginId=<id>` — force-clear the SQLite data cache
- `GET /api/export?days=N&format=csv|json&plugins=all|<id>` — export usage data
- `GET /api/stream` — SSE endpoint for live file-change push (chokidar watcher)
- `/` — overview dashboard (server component)
- `/[pluginId]` — per-plugin detail page (server component)

## Key Features Added (roadmap items completed)

- **Unified pricing registry** (`src/lib/pricing.ts`) — cost for all plugins via `getCostUSD()`
- **SQLite cache** (`src/lib/cache.ts`) at `~/.config/aitokentracker/cache.db` — mtime-based invalidation
- **Live updates** (`src/lib/watcher.ts` + `LiveUpdater` client component) — chokidar SSE push
- **Rate-limit awareness** (`src/lib/limits.ts`) — Claude message-count quota
- **Spending forecast**, **hourly heatmap**, **cache ROI**, **model timeline**, **cross-tool timeline**, **conversation search**, **data export**

## Design

Follows headlessengineer design system: teal accent `--accent-brand: #008383` (`--primary` resolves to it), Inter font, monochrome neutral ramp, CSS custom properties in `globals.css`. Dark mode via `body.dark-mode` class, toggled by `ThemeToggle` client component.

## Tech

- Next.js 16.2.10, React 19, TypeScript strict
- echarts 6.1.0 for charts (custom `EChart` client component wrapper, no echarts-for-react)
- SQLite cache at `~/.config/aitokentracker/cache.db` (via `node:sqlite`)
- CSS Modules only, no Tailwind

## Reference: source project

Original single-tool Claude tracker at `/Users/karan.popat/projects/theheadlessengineer/claude-token-tracker` (Express + Astro, not Next.js). Different tech stack, useful as reference for JSONL parsing logic.
