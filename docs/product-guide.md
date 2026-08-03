# AI Token Tracker — Product Guide

> **See also:** [`docs/project-understanding.md`](project-understanding.md) is the canonical current-state orientation map — verified against source on 2026-08-03. This guide focuses on the user-facing feature walkthrough.

## What Is AI Token Tracker?

AI coding tools — Claude Code, Cursor, Copilot, Windsurf, and others — consume tokens every time they read your code, generate a response, or invoke a sub-agent. These tokens translate directly into cost and plan limits, yet there is no unified place to see how much you are actually using across all your tools.

AI Token Tracker solves this. It is a self-hosted web dashboard that reads the usage data your AI tools write locally to your machine and presents it in a single, consistent view. You get granular breakdowns — by model, project, tool call type, skill invoked, and sub-agent — with full control over the time window.

**Who it is for:** Individual developers and engineering teams who use one or more AI coding tools and want to understand their usage patterns, manage plan limits, or audit costs.

**What it is not:** It is not a billing dashboard or a cloud service. It does not connect to any external API. All data stays on your machine.

---

## Key Features

### Overview Dashboard

The overview page aggregates data across every configured tool and shows:

- **Total tokens** consumed in the selected time window
- **Total conversations** across all active plugins
- **Active tools** — how many of the supported tools are configured vs. total
- **Last activity** — when you last used any AI tool
- **Token breakdown donut** — input vs. output vs. cache-read vs. cache-write proportions
- **Daily usage bar chart** — token consumption per day for the selected window
- **Annual activity heatmap** — GitHub-style calendar showing activity intensity across the year
- **Tool grid** — one card per supported tool showing its status and summary stats

### Per-Plugin Dashboard

Each tool has its own detail page, accessible from the OffcanvasNav hamburger drawer or the tool grid card. Claude Code is the flagship plugin with the richest data extraction (sub-agents, skills, MCPs, hooks, cost). Approximately 31 other tools are also real active integrations (Codex, Gemini, opencode, amp, cline, roocode, kilocode, goose, zed, qwen, and more — see the Supported Tools table below); only `cursor` and `windsurf` remain placeholders. The Claude Code detail page (`/claude`) shows:

- **4 KPI tiles** — total tokens, conversations, tool calls, last activity
- **Token breakdown** — same donut as the overview but scoped to this tool
- **Daily usage chart** — scoped timeline
- **Annual heatmap** — scoped to this tool's activity
- **Models chart** — horizontal bar chart of token usage per model (e.g. claude-sonnet-4-6, claude-opus-4-8)
- **Sub-agents panel** — donut showing how many times each sub-agent type was invoked (fork, code-reviewer, explore, etc.)
- **Skills panel** — bar chart of which skills were invoked by name (design-system, code-review, spec-authoring, etc.)
- **MCP servers panel** — donut of MCP server call counts
- **Top tools chart** — horizontal bar of every tool call by name, colour-coded by category (core / agent / skill / MCP)
- **Hooks panel** — configured hook events read from `~/.claude/settings.json` with estimated fire counts
- **Top projects bar list** — token consumption per project, sorted by usage
- **Conversation table** — recent conversations with project, model, token count, message count, last active, and status

### Navigation and Time Range

Tool switching and time filtering use two separate controls:

- **OffcanvasNav** — a hamburger icon in the top-right corner of the TopBar opens a full-height drawer listing Overview and all 34 registered plugins. Unavailable plugins (cursor, windsurf) appear dimmed. Close with the × button, ESC key, or clicking the backdrop.
- **ControlBar** — a single row below the TopBar containing only a **time-range selector**: 1D, 7D, 15D, 30D, 60D, or 90D. There is no view selector in the ControlBar; tool switching is handled entirely by the OffcanvasNav.

Selecting a range updates the URL (`?days=7`) and causes the server to re-render with data scoped to that window. The selected range affects the daily activity chart, heatmap, KPI totals, top-projects and top-models aggregations, and the conversation table. The range is bookmarkable and shareable.

### Draggable Dashboard Layout

Every plugin detail page and the overview use a **DashboardGrid** — a draggable, resizable widget grid built on `react-grid-layout`. To rearrange widgets:

1. Click **Edit layout** (top-right of the content area) to activate drag handles and corner resize grips.
2. Drag widgets by their handle bar or resize them from the bottom-right corner.
3. Click **Done editing** to save. The layout is persisted to `localStorage` under the key `aitokentracker-layout-<pluginId>` and restored on next visit.
4. Click **Reset layout** (visible only in edit mode) to restore the default arrangement.

New widgets added in future updates appear at the bottom of your saved layout rather than overwriting your positions.

### Dark Mode

A sun/moon toggle in the top-right of the TopBar (beside the OffcanvasNav hamburger) switches between light and dark themes. The preference is saved to `localStorage` under the key `headlessengineer-theme` and restored on next visit. The active theme sets the `dark-mode` class on `body`. If no preference is stored, the system's `prefers-color-scheme` setting is used.

### Brand Identity

The application header displays the HEADLESSENGINEER wordmark in the Bitcount Grid Double variable font. The word HEADLESS renders in the primary text colour; ENGINEER renders in the accent teal (`--primary`, currently `#008383` in `globals.css`). Hovering the wordmark triggers a "Swap" animation where ENGINEER slides out upward and a duplicate slides in from below, giving a rolling typographic effect. This animation respects `prefers-reduced-motion`.

### Browser Notifications

The dashboard monitors daily token usage and fires OS-level browser notifications when usage crosses configurable thresholds:

| Threshold | Severity | When |
|---|---|---|
| 50% of daily limit | Info | ≥ 25M tokens used today |
| 75% of daily limit | Warning | ≥ 37.5M tokens used today |
| 100% of daily limit | Critical | ≥ 50M tokens used today |

Notifications use `requireInteraction: true` — they stay visible until dismissed with the × button in the OS notification UI. The browser requests permission on first page load. If permission is denied, notifications are silently disabled. Each threshold fires at most once per browser session; opening a new tab resets the session.

The daily limit defaults to 50M tokens and is configurable in `src/lib/notifications/rules.ts`. New thresholds can be added as a single rule object — no other files need changing.

### Plugin System

AI Token Tracker uses a plugin architecture. Each AI tool is a self-contained plugin that implements a standard `TokenPlugin` interface. The application core knows nothing about individual tools — it just calls `isAvailable()` and `collect()` on whatever plugins are registered.

- If `isAvailable()` returns `false`, the tool shows as "Not configured" in the UI.
- If `isAvailable()` returns `true`, the full detail page and charts are populated from `collect()`.
- Adding a new tool requires no changes to the core app — only creating one file and registering it.

---

## Supported Tools

34 plugins are registered. 32 are real integrations with real data-path checks; 2 (`cursor`, `windsurf`) are hard placeholders (`isAvailable()` returns `false`).

**Flagship (rich extraction):**

| Tool | Data Source | What Is Tracked |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` + `~/.claude/settings.json` | Tokens (input/output/cache), cost, models, tool calls, sub-agents, skills, MCPs, hooks, projects, conversations |

**Active integrations (lightweight — tokens, models, projects, conversations):**

| Group | Tools |
|---|---|
| JSONL / session dirs | Codex (`~/.codex`), Gemini (`~/.gemini`), Copilot (`~/.copilot/otel`), opencode, amp, qwen, openclaw, pi, commandcode, codebuddy, gjc, zcode, opencodereview, kimi, junie, grok, jcode, codebuff, droid, mux, cline, roocode, kilocode |
| SQLite-backed | antigravity, devin, goose, hermes, kilo, micode, zed, opencode |
| VS Code extensions | roocode, kilocode, cline (VS Code `globalStorage`) |
| Kiro | `~/.kiro/sessions/cli` | Tokens, models, conversations |

**Placeholders (not yet implemented):**

| Tool | Status |
|---|---|
| Cursor | `isAvailable()` hard-returns `false`; no data path |
| Windsurf | `isAvailable()` hard-returns `false`; no data path |

> **Note:** `src/plugins/devindesktop/` exists on disk but is not registered — desktop NDJSON sources are handled directly by the `devin` plugin, which combines both CLI SQLite and Desktop NDJSON reads.

---

## Dashboard Walkthrough

The following describes a full session on the Claude Code detail page (`/claude`).

**1. ControlBar**
The first element in the page content area. Contains a single time-range selector dropdown and, on the detail page, a Refresh button and the plugin's data path label. Tool switching is handled by the OffcanvasNav hamburger in the TopBar, not the ControlBar. The TopBar is sticky, so the hamburger is always reachable regardless of scroll position.

**2. KPI tiles (4 cards)**
Four headline numbers side by side: total tokens for the window, total conversations, total tool calls (with unique tool count), and time since last activity. The "Total tokens" tile is highlighted in teal as the primary metric.

**3. Token breakdown + daily chart (two columns)**
On the left, a donut chart breaks the total token count into four types. On the right, a bar chart shows one bar per day over the selected window, giving you a sense of usage rhythm — heavy days, light days, gaps when you were offline.

**4. Annual heatmap**
A full-year calendar heatmap (like GitHub contributions) shows daily token volume. Darker teal = more tokens that day. Hover for an exact count.

**5. Models chart**
A horizontal bar chart sorted by token count. If you've used multiple models — Sonnet for day-to-day, Opus for complex tasks — this tells you how the distribution breaks down.

**6. Sub-agents · Skills · MCPs (three columns)**
Three donut/bar panels side by side:
- **Sub-agents** — how often you triggered each agent type (fork, code-reviewer, explore, general-purpose, etc.)
- **Skills** — which skills the assistant invoked on your behalf (design-system, code-review, spec-authoring, tdd-implement, etc.)
- **MCP servers** — if you have MCP servers configured, how many calls each received

**7. Top tools + Hooks (two columns)**
- **Top tools** — every tool call by name (Read, Bash, Edit, Write, Agent, Skill, …) as a horizontal bar, colour-coded by category
- **Hooks** — events configured in your `~/.claude/settings.json` with an estimated fire count derived from matching tool calls

**8. Top projects**
Horizontal bar list of the projects consuming the most tokens, with a proportional fill bar and absolute token count.

**9. Conversation table**
A paginated table of recent conversations: project name, model used, token count, message count, when it was last active, and a status badge (active / recent / inactive).

---

## Time Range Filter — How It Works

The time range filter controls which conversations are included in all aggregations. A conversation is included if its last-modified timestamp falls within the selected window. This applies to every section on the page: KPI totals, daily activity chart, heatmap, models breakdown, projects breakdown, tools chart, sub-agents, skills, MCPs, and conversation table.

| Range | Use case |
|---|---|
| 1D | Today's usage only — useful for checking a single heavy session |
| 7D | Past week — typical for weekly planning |
| 15D | Sprint view — aligns with two-week cycles |
| 30D | Default — monthly snapshot, good for cost estimation |
| 60D | Two-month trend — spots seasonal patterns |
| 90D | Quarterly — useful for budget reviews |

---

## Understanding Token Types

Every message you exchange with Claude involves tokens. The dashboard breaks them into four types:

**Input tokens**
The tokens in the messages you send — your prompt text, file contents you paste or that Claude reads, conversation history. These are the tokens Claude "reads" to formulate a response.

**Output tokens**
The tokens in Claude's reply — the code it writes, the explanation it gives, the plan it produces. These are usually the most expensive.

**Cache-read tokens**
When Claude has seen the same large context (e.g. a long system prompt or a big file) recently, it can reuse a cached version instead of re-processing it. Cache-read tokens are reads from that cache — significantly cheaper than regular input tokens.

**Cache-write tokens**
The first time a large context is cached, tokens are charged for writing it to the cache. Cache-write tokens cost slightly more than regular input tokens but pay off over multiple requests that reuse the same context.

**Total = input + output + cache-read + cache-write.** The donut chart always shows all four proportionally. In practice, heavy coding sessions with large files show high cache-read counts because the codebase context is reused across many turns.

---

## Claude Code Specifics

### How Data Is Collected

Claude Code writes every conversation to `~/.claude/projects/<encoded-path>/<conversation-id>.jsonl`. Each line in a `.jsonl` file is a JSON entry. The AI Token Tracker reads these files directly — no Claude API calls, no authentication.

The encoded path in the directory name maps to the working directory you had open when the session started (e.g. `-Users-you-projects-myapp` → `/Users/you/projects/myapp`).

### Models

Claude Code uses different models depending on your plan and the task. Common models seen in practice:

- `claude-sonnet-4-6` — fast, general-purpose
- `claude-opus-4-8` — more capable, used for complex tasks
- `claude-haiku-4-5` — lightweight, used for quick lookups

The models chart shows token consumption per model, so you can see if a particular model is dominating your usage.

### Sub-Agents

When Claude Code invokes the `Agent` tool, it launches a sub-agent — a separate Claude session that handles a specific part of the task. Sub-agent types include:

| Type | Purpose |
|---|---|
| `fork` | Inherits parent context, runs independently in background |
| `code-reviewer` | Dedicated code review pass |
| `explore` | Read-only codebase exploration |
| `test-runner` | Runs the test suite and reports results |
| `doc-writer` | Writes documentation to `docs/` |
| `general-purpose` | Catch-all for complex delegated tasks |
| `markdown-doc-generator` | Generates structured Markdown documents |

The sub-agents chart shows how many times you (or Claude) triggered each type.

### Skills

Skills are pre-packaged instruction sets that Claude invokes using the `Skill` tool. When the assistant calls `Skill({ skill: "design-system" })`, it loads a set of design system rules and follows them for the rest of the turn. Common skills observed in practice:

- `code-review`, `a11y-audit`, `security-review`
- `spec-authoring`, `spec-to-plan`, `tdd-implement`
- `design-system`, `component-build`, `brand`
- `documentation`, `release`

The skills chart shows invocation frequency — which skills your workflow triggers most.

### MCPs (Model Context Protocol Servers)

MCPs extend Claude's tool set with external integrations. If you have MCP servers configured (e.g. a Figma integration, a database connector), their tool calls appear in the JSONL as `mcp__<server>__<tool>`. The MCP chart aggregates these by server.

### Hooks

Hooks are shell scripts or agent prompts that fire automatically at certain events — before a tool runs, after an edit, when a session starts, when Claude stops. They are defined in `~/.claude/settings.json` under keys like `PreToolUse`, `PostToolUse`, `SessionStart`, and `Stop`.

Hooks do not write entries to the JSONL files, so they cannot be tracked directly. Instead, AI Token Tracker reads your `settings.json`, identifies configured hooks, and approximates how many times each fired based on matching tool call counts (e.g. a `PreToolUse` hook matching `Write|Edit` fired approximately as many times as you called Write and Edit).

---

## FAQ

**Q: The dashboard shows no data. What do I do?**
Make sure Claude Code is installed and you have had at least one conversation. Check that `~/.claude/projects/` exists and contains `.jsonl` files. The app reads that directory at page load — no background process is needed.

**Q: Does this send my data anywhere?**
No. All file reading happens in the Next.js server process running on your machine. No data is sent to any external service.

**Q: Why do my token counts differ from what Claude.ai shows?**
Claude.ai shows tokens per message as you chat. AI Token Tracker reads the JSONL files that Claude Code writes locally, which include cache tokens that the web interface does not display separately. The totals may differ slightly due to rounding and how Claude Code records usage internally.

**Q: Can I use this with Claude.ai (the web app) instead of Claude Code?**
Not currently. The Claude plugin specifically reads the JSONL files that Claude Code (the CLI/IDE tool) writes. Claude.ai does not write local data files. A Claude.ai plugin would require using the Anthropic API to fetch conversation history.

**Q: How do I add a tool that isn't in the list yet?**
See the developer guide (`docs/developer-guide.md`). You implement one TypeScript file, register it, and restart the dev server. No core app changes needed.

**Q: How accurate are the hook fire counts?**
They are estimates. The count for a `PreToolUse` hook with matcher `Write|Edit` is the sum of Write and Edit tool calls across all conversations in the selected window. Treat these as approximate figures rather than precise counts.

**Q: A tool shows as "Not configured". Will it show data automatically once I install the tool?**
Yes — as long as the plugin's `isAvailable()` function correctly detects the tool's data path. For the 32 real integrations, it activates automatically once the tool has been used and written its local data files. The two remaining placeholders (`cursor` and `windsurf`) hard-return `false` from `isAvailable()` regardless; they will activate once a real implementation is added.

**Q: I changed the time range but some charts didn't update.**
This was a bug in an earlier version where the `since` cutoff was only applied to the daily activity bucket. It is now fixed: all aggregations — KPIs, models, projects, tools, sub-agents, skills, MCPs — are filtered by the selected time range.

**Q: Browser notifications aren't appearing. What's wrong?**
The browser must have granted notification permission for this site. Check your browser's site settings and ensure notifications are set to "Allow". Also note that each threshold fires at most once per browser session — if the notification already fired and was dismissed, it will not re-appear on the same tab. Open a new tab to reset the session state. If permission is set to "Block", you must re-enable it manually in browser settings; the app cannot prompt again after a denial.
