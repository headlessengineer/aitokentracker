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

## Active Plugins

- **34 plugins registered** in `src/plugins/index.ts` (as of 2026-08-03).
- **claude** — rich reference impl (own `collector.ts`; extracts tools/sub-agents/skills/MCP/hooks/cost from `~/.claude/projects/**/*.jsonl`).
- **~32 real integrations** — each has a real `dataPath` + `isAvailable` check. Two implementation flavors: JSONL/session-dir readers using shared `core/collect.ts` helpers (`buildPluginData`, `parseClaudeStyleJsonl`, `globFiles`), and SQLite-backed readers via `node:sqlite` (antigravity, devin, goose, hermes, kilo, micode, opencode, zed).
- **cursor, windsurf** — the only hard placeholders (`isAvailable()` returns false).
- **devindesktop** — dir exists but is NOT registered in `index.ts` (orphaned).

See `docs/project-understanding.md` for the full code-verified orientation map.

## Routes

- `GET /api/plugins` — list all plugins with availability
- `GET /api/summary?days=N` — aggregated tokens across all available plugins
- `GET /api/[pluginId]/data?days=N&limit=N` — per-plugin detailed data
- `/` — overview dashboard (server component)
- `/[pluginId]` — per-plugin detail page (server component)

## Design

Follows headlessengineer design system: teal accent `--accent-brand: #008383` (`--primary` resolves to it), Inter font, monochrome neutral ramp, CSS custom properties in `globals.css`. Dark mode via `body.dark-mode` class, toggled by `ThemeToggle` client component. (Canonical accent is `#008383` — the design-system/brand skills and docs were updated repo-wide from the old teal to match.)

## Tech

- Next.js 16.2.10, React 19, TypeScript strict
- echarts 6.1.0 for charts (custom `EChart` client component wrapper, no echarts-for-react)
- No DB, no auth — reads local filesystem in server components
- CSS Modules only, no Tailwind

## Reference: source project

Original single-tool Claude tracker at `/Users/karan.popat/projects/theheadlessengineer/claude-token-tracker` (Express + Astro, not Next.js). Different tech stack, useful as reference for JSONL parsing logic.
