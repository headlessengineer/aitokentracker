# AI Token Tracker — Product Guide

> **See also:** [`docs/project-understanding.md`](project-understanding.md) is the canonical current-state orientation map — verified against source on 2026-08-05. This guide focuses on the user-facing feature walkthrough.

## What Is AI Token Tracker?

AI coding tools — Claude Code, Cursor, Copilot, Windsurf, and others — consume tokens every time they read your code, generate a response, or invoke a sub-agent. These tokens translate directly into cost and plan limits, yet there is no unified place to see how much you are actually using across all your tools.

AI Token Tracker solves this. It is a self-hosted web dashboard that reads the usage data your AI tools write locally to your machine and presents it in a single, consistent view. You get granular breakdowns — by model, project, tool call type, skill invoked, and sub-agent — with full control over the time window.

**Who it is for:** Individual developers and engineering teams who use one or more AI coding tools and want to understand their usage patterns, manage plan limits, or audit costs.

**What it is not:** It is not a billing dashboard or a cloud service. It does not connect to any external API. All data stays on your machine.

---

## Key Features

### Overview Dashboard

The overview page aggregates data across every configured tool and shows:

- **Per-plugin KPI cards** — one card per active tool with total tokens, cost, conversations, and last activity
- **Cross-tool aggregated timeline** — stacked bar chart showing token consumption per day broken down by tool; up to 10 tools in a teal monochrome palette
- **Spending forecast KPI** — "At this pace — $XX this month" projected from the trailing 7-day average daily cost
- **Quota status widget** — Claude daily message count shown as a progress bar; amber at 70%, red at 90%; triggers a notification at 80%
- **Cross-tool project attribution table** — unified table joining `topProjects[]` across all plugins, grouped by repo root
- **Annual activity heatmap** — GitHub-style calendar showing activity intensity across the year
- **Tool grid** — one card per supported tool showing its availability status and summary stats

### Per-Plugin Dashboard

Each tool has its own detail page, accessible from the OffcanvasNav hamburger drawer or the tool grid card. Claude Code is the flagship plugin with the richest data extraction. All 34 integrations are real active implementations. The detail page shows:

- **KPI tiles** — total tokens, conversations, tool calls (with unique-tool count), last activity, total cost, and (Claude only) cache savings
- **Token breakdown** — donut chart of input / output / cache-read / cache-write proportions
- **Daily usage timeline** — stacked bar chart scoped to the selected time window
- **Daily cost chart** — bar chart of cost per day; Claude additionally shows a dashed "without cache" comparison line
- **Annual activity heatmap** — full-year calendar scoped to this tool
- **Hourly activity heatmap** — 24 × 7 grid (hour of day × day of week) showing when you use the tool most
- **Model breakdown** — horizontal bar chart of token usage per model
- **Model transition timeline** — stacked area chart showing model share over time (how usage shifted as models evolved)
- **Sub-agents panel** — donut of agent-type invocation counts (Claude only)
- **Skills panel** — bar chart of skill invocations by name (Claude only)
- **MCP servers panel** — donut of MCP server call counts (Claude only)
- **Top tools chart** — every tool call by name, colour-coded by category (Claude only)
- **Tool category donut** — core / agent / skill / MCP proportions (Claude only)
- **Hooks panel** — configured hook events with estimated fire counts (Claude only)
- **Session duration histogram** — conversations bucketed by duration (< 5 min, 5–30 min, 30 min–2 hr, 2 hr+)
- **Top projects table** — token consumption and cost per project
- **Conversation table** — recent conversations with search, keyboard navigation, and expandable token detail rows

### Navigation and Time Range

Tool switching and time filtering use two separate controls:

- **OffcanvasNav** — a hamburger icon in the top-right corner of the TopBar opens a full-height drawer listing Overview and all 34 registered plugins. Plugins whose data path is not yet present on the machine appear dimmed. Close with the × button, ESC key, or clicking the backdrop.
- **ControlBar** — a single row below the TopBar containing a **time-range selector** (Today, 1D, 7D, 15D, 30D, 60D, 90D, All time) and, on detail pages, an **Export** button and the plugin's data path label.

Selecting a range updates the URL (`?days=7`) and causes the server to re-render with data scoped to that window. The range affects every aggregation on the page: KPI totals, all charts, models, projects, tools, and the conversation table. The range is bookmarkable and shareable.

### Draggable Dashboard Layout

Every plugin detail page and the overview use a **DashboardGrid** — a draggable, resizable widget grid built on `react-grid-layout`. To rearrange widgets:

1. Click **Edit layout** (top-right of the content area) to activate drag handles and corner resize grips.
2. Drag widgets by their handle bar or resize them from the bottom-right corner.
3. Click **Done editing** to save. The layout is persisted to `localStorage` under the key `aitokentracker-layout-<pluginId>` and restored on next visit.
4. Click **Reset layout** (visible only in edit mode) to restore the default arrangement.

New widgets added in future updates appear at the bottom of your saved layout rather than overwriting your positions.

### Live Updates

The dashboard stays current automatically. A file-system watcher (chokidar) monitors every plugin's data directory. When any AI tool writes new data — finishing a Claude session, completing a Codex run — the watcher fires a server-sent event and the dashboard refreshes within 1–2 seconds, without any manual interaction.

If the SSE connection drops (e.g. the server restarts), the client falls back to 10-second polling and auto-reconnects every 8 seconds.

### Data Export

An **Export** button in the ControlBar on each detail page (and the overview) downloads your usage data as CSV or JSON.

- **Format:** `GET /api/export?format=csv|json&days=N&plugins=all|<pluginId>`
- **Schema:** one record per daily bucket per plugin — `pluginId`, `date`, `tokens`, `costUSD`, `model`, `project`
- **Use cases:** import into a spreadsheet for budget tracking, archive a historical snapshot, migrate data to another tool

### Dark Mode

A sun/moon toggle in the top-right of the TopBar (beside the OffcanvasNav hamburger) switches between light and dark themes. The preference is saved to `localStorage` under the key `headlessengineer-theme` and restored on next visit. The active theme sets the `dark-mode` class on `body`. If no preference is stored, the system's `prefers-color-scheme` setting is used.

### Brand Identity

The application header displays the HEADLESSENGINEER wordmark in the Bitcount Grid Double variable font. The word HEADLESS renders in the primary text colour; ENGINEER renders in the accent teal (`--primary`, `#008383`). Hovering the wordmark triggers a "Swap" animation where ENGINEER slides out upward and a duplicate slides in from below. This animation respects `prefers-reduced-motion`.

### Browser Notifications

The dashboard monitors usage and fires OS-level browser notifications for the following conditions:

| Rule | Severity | Condition |
|---|---|---|
| Daily token limit — 50% | Info | ≥ 25M tokens used today (50% of 50M limit) |
| Daily token limit — 75% | Warning | ≥ 37.5M tokens used today |
| Daily token limit — 100% | Critical | ≥ 50M tokens used today |
| Rate limit approaching | Warning | Any provider reaches ≥ 80% of its quota |
| Daily digest | Info | Opt-in; fires once per day with yesterday's token total, cost, and top tool |

Notifications use `requireInteraction: true` — they stay visible until dismissed. The browser requests permission on first page load. Each threshold fires at most once per browser session. The daily limit defaults to 50M tokens and is configurable in `src/lib/notifications/rules.ts`.

**Daily digest** is off by default. Enable it via the toggle in the ControlBar. Once enabled, it fires once per calendar day with a summary: "1.2M tokens · $0.42 · Top: claude".

**Rate limit warning** reads Claude's daily message count from `~/.claude/stats-cache.json`. Other providers (Cursor, Copilot) require live API calls and are deferred to a future update.

### Plugin System

AI Token Tracker uses a plugin architecture. Each AI tool is a self-contained plugin that implements a standard `TokenPlugin` interface. The application core knows nothing about individual tools — it just calls `isAvailable()` and `collect()` on whatever plugins are registered.

When a plugin is unavailable, the detail page now shows a reason-specific message:

| Reason | Shown message |
|---|---|
| `path_missing` | "Install and use this tool — data will appear here automatically." |
| `not_installed` | "This tool is not available on your machine." |
| `parse_error` | "Data files were found but could not be read. This may be caused by a recent format change…" |
| `placeholder` | "Parser not yet implemented — check back in a future release." |

---

## Supported Tools

All 34 plugins are real implementations with active data-path checks. Zero placeholders.

**Flagship (rich extraction):**

| Tool | Data Source | What Is Tracked |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` + `~/.claude/settings.json` | Tokens (input/output/cache), cost, models, tool calls, sub-agents, skills, MCPs, hooks, projects, conversations |

**Active integrations — JSONL / session directories:**

| Tool | Data Path |
|---|---|
| OpenAI Codex | `~/.codex/sessions/` |
| Gemini CLI | `~/.gemini/tmp/` |
| GitHub Copilot | `~/.copilot/otel/` + VS Code workspaceStorage |
| Amp | `~/.amp/` |
| Qwen CLI | `~/.qwen/` |
| OpenClaw | `~/.openclaw/` |
| Pi | `~/.pi/` |
| Command Code | `~/.commandcode/` |
| CodeBuddy | `~/.codebuddy/` |
| GJC | `~/.gjc/` |
| ZCode | `~/.zcode/` |
| OpenCode Review | local session files |
| Kimi | `~/.kimi/` |
| Junie | `~/.junie/` |
| Grok Build | `~/.grok/sessions/` |
| JCode | `~/.jcode/` |
| Codebuff | `~/.codebuff/` |
| Droid | `~/.droid/` |
| Mux | `~/.mux/` |

**Active integrations — SQLite databases:**

| Tool | Data Path |
|---|---|
| Antigravity | local SQLite DB |
| Devin (CLI + Desktop) | `~/.local/share/devin/cli/sessions.db` + Desktop NDJSON |
| Goose | local SQLite DB |
| Hermes | `state.db` |
| Kilo | VS Code globalStorage SQLite |
| MiMo Code | SQLite DB |
| OpenCode | `~/.local/share/opencode/` SQLite |
| Zed | `threads.db` |

**Active integrations — VS Code extension storage:**

| Tool | Data Path |
|---|---|
| Roo Code | VS Code `globalStorage/rooveterinaryinc.roo-cline/tasks/` |
| Cline | VS Code `globalStorage/saoudrizwan.claude-dev/tasks/` |
| Kilo Code | VS Code `globalStorage/kilocode.kilo-code/tasks/` |
| Windsurf | Windsurf `globalStorage/` (scans all extensions with Cline-style task dirs) |

**Active integrations — API / special:**

| Tool | Notes |
|---|---|
| Cursor | Fetches CSV from `cursor.com/api/dashboard/export-usage-events-csv` using auth token from `state.vscdb`; 1-hour local CSV cache |
| Kiro | `~/.kiro/sessions/cli` — tokens, models, conversations |

---

## Dashboard Walkthrough

A full session on the Claude Code detail page (`/claude`).

**1. ControlBar**
Time-range selector on the left, Export button and data-path label on the right. All selections update the URL and re-render the page server-side.

**2. KPI tiles**
Six headline numbers: total tokens (teal accent), conversations, tool calls, last activity, total cost, and cache savings. Cache savings appears only when cache-read data is available and shows dollars saved vs. no-cache pricing.

**3. Token breakdown + daily chart**
Left: donut of input / output / cache-read / cache-write. Right: stacked bar chart showing daily token breakdown for the selected window.

**4. Daily cost chart**
Bar chart of USD cost per day. A dashed "without cache" line shows what you would have paid without prompt caching — the gap is your cache savings visualised over time.

**5. Annual heatmap + Hourly heatmap**
Side by side. The annual heatmap shows day-level activity across the whole year. The hourly heatmap shows a 24 × 7 grid — which hours and days of the week you use Claude most. Useful for spotting work rhythms and late-night sessions.

**6. Model breakdown + Model transition timeline**
Left: horizontal bar chart of total tokens per model. Right: stacked area chart showing how model share evolved over the selected window — see when you shifted from Sonnet to Opus or adopted a new model.

**7. Sub-agents · Skills · MCPs**
Three panels: sub-agent invocation counts (fork, code-reviewer, explore, etc.), skill invocation counts (design-system, tdd-implement, etc.), and MCP server call counts.

**8. Tool category donut + Top tools**
Left: donut of core / agent / skill / MCP call proportions. Right: horizontal bar of every tool by name and call count, colour-coded by category.

**9. Hooks panel**
Hook events from `~/.claude/settings.json` with estimated fire counts based on matching tool call totals.

**10. Session duration histogram**
Conversations grouped into four duration buckets: < 5 min, 5–30 min, 30 min–2 hr, 2 hr+.

**11. Top projects**
Table of repos by token consumption with cost breakdown.

**12. Conversation table**
Recent conversations with project, model, token count, message count, last active, and status badge. Features:
- **Search:** filter by project path or conversation ID (debounced, persisted in URL as `?search=`)
- **Keyboard navigation:** Arrow Up/Down moves row focus; Tab exits the table; Enter or Space expands the focused row to show full token detail (input, output, cache read, cache write, created timestamp)
- **Click to expand:** mouse users can click any row to toggle the detail panel

---

## Time Range Filter — How It Works

| Range | Use case |
|---|---|
| Today | Usage since midnight local time — useful during an active session |
| Last 1 day | Yesterday + today — for reviewing a single heavy day |
| Last 7 days | Past week — typical for weekly planning |
| Last 15 days | Sprint view — aligns with two-week cycles |
| Last 30 days | Default — monthly snapshot, good for cost estimation |
| Last 60 days | Two-month trend — spots seasonal patterns |
| Last 90 days | Quarterly — useful for budget reviews |
| All time | No date gate — all data ever collected |

The time range filter controls which conversations are included in all aggregations. A conversation is included if its last-modified timestamp falls within the selected window.

---

## Understanding Token Types

**Input tokens** — the tokens in the messages you send (prompt text, file contents, conversation history).

**Output tokens** — the tokens in the AI's reply (code written, explanations, plans). Usually the most expensive.

**Cache-read tokens** — reads from a cached context (e.g. a large system prompt seen recently). Significantly cheaper than input tokens.

**Cache-write tokens** — writing a large context to cache for the first time. Slightly more expensive than input tokens, but pays off when the same context is reused across many turns.

**Total = input + output + cache-read + cache-write.** Heavy coding sessions with large files show high cache-read counts because the codebase context is reused across many turns.

---

## Claude Code Specifics

### How Data Is Collected

Claude Code writes every conversation to `~/.claude/projects/<encoded-path>/<conversation-id>.jsonl`. Each line is a JSON entry. AI Token Tracker reads these files directly — no Claude API calls, no authentication required.

The encoded path maps to the working directory open when the session started (e.g. `-Users-you-projects-myapp` → `/Users/you/projects/myapp`).

### Models

Common models seen in practice:

- `claude-sonnet-4-6` — fast, general-purpose
- `claude-opus-4-8` — more capable, used for complex tasks
- `claude-haiku-4-5` — lightweight, used for quick lookups

The model transition timeline shows when your usage shifted between models.

### Sub-Agents

When Claude Code invokes the `Agent` tool, it launches a sub-agent — a separate Claude session for a specific part of the task.

| Type | Purpose |
|---|---|
| `fork` | Inherits parent context, runs independently in background |
| `code-reviewer` | Dedicated code review pass |
| `explore` | Read-only codebase exploration |
| `test-runner` | Runs the test suite and reports results |
| `doc-writer` | Writes documentation to `docs/` |
| `general-purpose` | Catch-all for complex delegated tasks |
| `markdown-doc-generator` | Generates structured Markdown documents |

### Skills

Skills are pre-packaged instruction sets invoked with the `Skill` tool. Common skills:

- `code-review`, `a11y-audit`, `security-review`
- `spec-authoring`, `spec-to-plan`, `tdd-implement`
- `design-system`, `component-build`, `brand`
- `documentation`, `release`

### MCPs (Model Context Protocol Servers)

MCPs extend Claude's tool set with external integrations. Their calls appear in JSONL as `mcp__<server>__<tool>`. The MCP chart aggregates by server.

### Cache ROI

The Cache ROI KPI shows how much you saved (in USD) because of prompt caching, computed as:

```
savedUSD = cacheReadTokens × (inputPricePerToken − cacheReadPricePerToken)
```

The daily cost chart's dashed "without cache" line shows this same saving broken down day by day.

### Hooks

Hooks are shell scripts or agent prompts that fire at events like `PreToolUse`, `PostToolUse`, `SessionStart`, and `Stop`. They are defined in `~/.claude/settings.json`. Since hooks do not write JSONL entries, AI Token Tracker approximates fire counts from matching tool call totals. Treat these as estimates.

---

## FAQ

**Q: The dashboard shows no data. What do I do?**
Make sure the tool is installed and you have had at least one session. Check that the tool's data path exists (shown on the plugin's detail page in the ControlBar). The app reads data at page load — no background process is needed when SSE is unavailable.

**Q: Does this send my data anywhere?**
No. All file reading happens in the Next.js server process running on your machine. No data leaves your machine.

**Q: Why do my token counts differ from what Claude.ai shows?**
Claude.ai shows per-message tokens in the web UI. AI Token Tracker reads the JSONL files Claude Code writes, which include cache tokens the web interface does not display separately. Totals may differ slightly due to rounding and internal recording details.

**Q: Can I use this with Claude.ai (the web app) instead of Claude Code?**
Not currently. The Claude plugin reads JSONL files that only Claude Code (the CLI/IDE tool) writes. A Claude.ai plugin would require using the Anthropic API to fetch conversation history.

**Q: How do I add a tool that isn't in the list yet?**
See [`docs/developer-guide.md`](developer-guide.md). You implement one TypeScript file, register it in `src/plugins/index.ts`, and restart the dev server. No core app changes are needed.

**Q: How accurate are the hook fire counts?**
They are estimates derived from matching tool call totals. A `PreToolUse` hook matching `Write|Edit` is estimated as the sum of Write and Edit calls across the window. Treat these as approximate figures.

**Q: A tool shows as "Not configured" with a parse error message. What does that mean?**
Data files were found on your machine but could not be read — usually caused by a format change in a recent release of the tool. Try clicking Refresh. If the problem persists, the plugin may need an update to handle the new format; open an issue.

**Q: A tool shows as "Not configured". Will it activate automatically once I install the tool?**
Yes — all 34 plugins activate automatically once the tool has been installed and used at least once (creating its data files). Cursor additionally requires a local auth token in `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`.

**Q: I changed the time range but some charts didn't update.**
Every aggregation — KPIs, all charts, models, projects, tools, sub-agents, skills, MCPs, and the conversation table — is filtered by the selected time range at the server level. If something looks stale, click Refresh (or wait for the live SSE update).

**Q: Browser notifications aren't appearing. What's wrong?**
Check your browser's site settings and ensure notifications are set to "Allow". Each rule fires at most once per browser session — open a new tab to reset. After a permission denial the app cannot prompt again; re-enable it manually in browser settings.

**Q: How do I enable the daily digest?**
Toggle **Daily digest** in the ControlBar. Once enabled, a browser notification fires once per calendar day the first time you open the dashboard, summarising yesterday's token total, cost, and top tool.

**Q: Can I export my data?**
Yes. Click **Export** in the ControlBar and choose CSV or JSON. The download covers the selected time window and all (or a specific) plugin. The schema is one record per daily bucket per plugin: date, tokens, costUSD, model, project.
