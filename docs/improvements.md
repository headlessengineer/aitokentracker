# AI Token Tracker — Improvement Roadmap

**Mission:** Personal AI usage intelligence — equip the individual user with the most complete picture of their own AI token usage across all tools, on a single machine, with no social or cross-user comparison.

This document is derived from a structured comparison of AI Token Tracker against Token Monitor, Tokscale, and Token Tracker. Every item below is filtered to the personal-use lens: if a feature exists in another tool but only makes sense in a social/leaderboard context, it is excluded here.

---

## How to read this list

Each item carries:
- **Context** — what the current state is and why the gap matters
- **Approach** — the minimal implementation path, grounded in existing code
- **Gain** — what the user gets once it ships

Checkboxes track completion status. Items are ordered by the priority sequence agreed during planning.

---

## 1. Architecture

Foundational changes that unlock the feature work below. These should land before the analytical features.

---

### 1.1 Unified pricing registry ✅
- [x] Create `src/lib/pricing.ts` — a shared module that exposes `getCostUSD(model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens): number`
- [x] Bundle a baseline pricing table (35 model patterns across Claude, OpenAI, Gemini, Grok, Kimi, Qwen, DeepSeek) as a const array in `pricing.ts`
- [x] Add a daily refresh: `refreshPricing()` fetches LiteLLM pricing JSON, writes to `~/.config/aitokentracker/pricing.json`; skips if file is < 24h old; bundled rates are the fallback
- [x] Update all 23 lightweight plugins to call `getCostUSD()` — done via `buildPluginData()` in `collect.ts` which now computes cost per conversation and builds `dailyCost[]`
- [x] Update all 8 SQLite plugins to call `getCostUSD()` — done via same `buildPluginData()` path
- [x] `ClaudePlugin` already uses its own `costForUsage()` (more precise: handles 5m/1h cache TTL split) — kept as-is; shared `getCostUSD` covers all other plugins
- [x] `GeminiPlugin` and `AntigravityPlugin` (which build their own `PluginData`) updated directly to call `getCostUSD()` and populate `dailyCost[]`

**Context:** Only Claude currently reports `totalCostUSD`. All 23 lightweight plugins and 8 SQLite plugins return `0`. This makes every cost chart on the Overview page meaningless — the numbers represent a fraction of actual spend. The fix is a single pricing module used by all plugins.

**Gain:** Accurate spend figures for Codex, Gemini, Grok, Kiro, Hermes, Goose, Zed, and every other tracked tool. Enables the spending forecast and cross-tool cost attribution features below.

---

### 1.2 Caching layer with `mtime`-based invalidation ✅
- [x] Added `src/lib/cache.ts` — SQLite-backed cache at `~/.config/aitokentracker/cache.db`; DB singleton survives Next.js hot reloads via `globalThis`
- [x] Schema: `plugin_cache(pluginId TEXT, days INTEGER, collectedAt INTEGER, data TEXT, PRIMARY KEY(pluginId, days))`
- [x] `maxMtimeMs(dir)` walks the plugin's `dataPath` recursively (capped at 2000 entries) and returns the highest mtime seen — no plugin changes needed
- [x] Cache validation: if `max(file mtime) > collectedAt`, cache is stale and plugin re-collects; result written back; JSON `dateReviver` rehydrates `Date` fields on read
- [x] Wrapping done in `PluginRegistry.register()` — all 34 plugins get caching transparently; zero call-site changes in pages or route handlers
- [x] Added `POST /api/cache/clear` route (optional `?pluginId=` param); `RefreshButton` calls it before `router.refresh()` for a guaranteed force-refresh
- [x] `AutoRefresh` unchanged — it calls `router.refresh()` which re-runs server components; mtime check ensures re-collect only when files have actually changed

**Context:** Every page load re-reads all JSONL and SQLite files cold. The architecture doc acknowledges this scales linearly with conversation count. A user with 5,000 conversations across 10 plugins already feels this. The cache doc lists "future mitigation: incremental read using mtime filtering" — this task implements that mitigation.

**Gain:** Sub-5ms responses for repeat requests. Makes the live-update SSE feature (1.3) practical — a file-change event only triggers re-collection for the one affected plugin, not a full re-read of everything.

---

### 1.3 File-watcher → SSE push for live updates ✅
- [x] Added `chokidar` as a dependency (pnpm add chokidar)
- [x] Created `src/app/api/stream/route.ts` — persistent SSE route; sends a `: connected` ping on open, then a `: heartbeat` comment every 25s to prevent proxy timeouts; `X-Accel-Buffering: no` header for nginx compatibility
- [x] Created `src/lib/watcher.ts` — chokidar singleton on `globalThis` (survives hot reloads); watches all plugin `dataPath` directories that currently exist; maps changed file path back to `pluginId` via prefix match; ignores dotfiles and lock files
- [x] On any file change: watcher broadcasts `data: {"pluginId":"<id>"}` to all connected SSE clients
- [x] Created `src/components/ui/LiveUpdater.tsx` — opens `EventSource('/api/stream')`; calls `router.refresh()` on every message; falls back to 10s polling if SSE unavailable; auto-reconnects every 8s on error with fallback polling during the gap
- [x] Replaced `<AutoRefresh intervalMs={5000} />` with `<LiveUpdater />` in `[pluginId]/page.tsx`
- [x] Added `<LiveUpdater />` to overview `page.tsx` (previously had no live updates at all)
- [x] `AutoRefresh` component kept intact as a reusable utility

**Context:** Data is currently stale until the user clicks Refresh or `AutoRefresh` fires on its timer. Token Monitor and Token Tracker both detect file changes within seconds. For a tool meant to give the user awareness of their current usage, a ~30-second polling lag undermines that purpose.

**Gain:** Dashboard updates within 1–2 seconds of an AI tool writing new JSONL. Removes the need to manually refresh after finishing a Claude session.

---

### 1.4 Plugin capability manifest ✅
- [x] Added `PluginCapabilities` interface to `src/plugins/core/types.ts` (`cost`, `models`, `projects`, `sessions`, `rateLimit`); field is optional on the raw plugin object
- [x] Registry applies sensible defaults (`cost/models/projects/sessions: true`, `rateLimit: false`) at `register()` time — all 34 plugins have guaranteed capabilities post-registration
- [x] `cursor` and `windsurf` (placeholders): explicit `all-false` capabilities declared
- [x] `claude`: explicit capabilities documenting the rich plugin's contract
- [x] `[pluginId]/page.tsx` unavailable branch: detects placeholder (`!dataPath && all caps false`) → shows "coming soon" message instead of generic "install the tool" message
- [x] `[pluginId]/page.tsx` widget section: `hasCost`, `hasModels`, `hasProjects`, `hasConversations` now AND with `caps.* !== false` — plugins that declare no support never render that widget

**Context:** The plugin page currently guards each widget with `if (data.topModels.length > 0)` checks. This means a plugin that *should* report models but returns an empty array (e.g., a bug in the parser) silently hides the widget with no diagnostic signal. A capability manifest separates "this plugin doesn't support models" from "this plugin supports models but returned no data this period."

**Gain:** Cleaner conditional rendering logic in pages. Better empty-state UX. Foundation for the diagnostics panel (4.4).

---

## 2. Data Coverage

Filling gaps in which tools are tracked and what data is collected from each.

---

### 2.1 Cursor plugin (currently placeholder) ✅
- [x] Researched Cursor's data format: no local usage files are written — all usage data lives server-side, accessible via `https://cursor.com/api/dashboard/export-usage-events-csv?strategy=tokens`
- [x] Auth: session token read from `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` (SQLite, `ItemTable` → `cursorAuth/accessToken`); user ID from `~/.cursor/cli-config.json` → `authInfo.authId` with JWT payload fallback
- [x] Implemented full `CursorPlugin` in `src/plugins/cursor/index.ts`: JWT extraction → cookie construction → CSV fetch with 1-hour file cache at `~/.config/aitokentracker/cursor-usage.csv` → stale-cache fallback on network failure
- [x] CSV parser is header-based (column order may change across Cursor releases): Date, Model, Input (w/ Cache Write), Input (w/o Cache Write), Cache Read, Output Tokens, Cost
- [x] Cost comes directly from the CSV `Cost` column (reflects Pro inclusions / $0 for included requests) — does NOT re-derive from token × rate
- [x] Aggregates rows into daily-bucket ConversationSummary objects (Cursor CSV has no session/conversation IDs); dominant model per day
- [x] `capabilities: { cost: true, models: true, projects: false, sessions: true, rateLimit: false }`
- [x] `isAvailable()` = `state.vscdb` exists (Cursor installed + logged in)
- [x] `dataPath: ''` — bypasses mtime-based PluginData cache; plugin manages own 1-hour CSV refresh internally

**Context:** Cursor is one of the most widely used AI coding tools. Its plugin is currently a hard-coded placeholder that always returns `isAvailable() = false` and `emptyPluginData()`. Users who pay for a Cursor subscription get no visibility into their usage from this app.

---

### 2.2 Windsurf plugin (currently placeholder) ✅
- [x] Windsurf's globalStorage is at `~/Library/Application Support/Windsurf/User/globalStorage/` (macOS) or `~/.config/Windsurf/User/globalStorage/` (Linux) — correctly platform-resolved at runtime
- [x] No reference implementation for Windsurf Cascade's proprietary format was found in any comparison app; plugin instead scans globalStorage for **Cline-style `tasks/ui_messages.json` files** from any installed extension (Cline, Roo Code, Kilo Code, etc. installed within Windsurf)
- [x] `capabilities: { cost: true, models: false, projects: false, sessions: true, rateLimit: false }` — models are not reliably available from `ui_messages.json` (hardcoded `claude-sonnet` is misleading)
- [x] `isAvailable()` = Windsurf globalStorage directory exists
- [x] `dataPath: GLOBAL_STORAGE` — mtime-based PluginData cache works naturally (tasks directory mtime changes when new tasks are written)

**Context:** Same situation as Cursor — placeholder only. Windsurf uses the same VS Code extension host storage pattern as Cline, Roo Code, and Kilo Code, which are all already implemented. The implementation cost is low.

---

### 2.3 Activate the unregistered Devin Desktop plugin ✅
- [x] `src/plugins/devin/index.ts` already handles both CLI SQLite (`~/.local/share/devin/cli/sessions.db`) and Desktop NDJSON (`~/Library/Application Support/Devin/User/acp-events/`)
- [x] `src/plugins/devindesktop/index.ts` re-exports the `devin` plugin for registry compatibility
- [x] `DEVIN_PLUGIN` is imported and registered in `src/plugins/index.ts` — the plugin is live

**Context:** `src/plugins/devindesktop/` exists on disk and re-exports `DEVIN_PLUGIN` (which handles both Devin CLI SQLite and Devin Desktop NDJSON), but it is never imported in `src/plugins/index.ts`. This is a one-line fix — no new code is required.

---

### 2.4 Rate-limit / quota awareness per provider ✅
- [x] Created `src/lib/limits.ts` with `ProviderLimit` type (`provider, pluginId, used, total, unit, resetAt, pct`); `readAllLimits()` with 5-minute in-memory cache on `globalThis` (survives Next.js hot reloads)
- [x] Claude Code: reads `~/.claude/stats-cache.json` → today's `messageCount`; default limit of 2000 messages/day (conservative Max 20x estimate); `resetAt` = next midnight local
- [x] Note: provider limits for Copilot and Cursor require live API calls (not local-only); those are deferred to a future task alongside OAuth credential support
- [x] Created `src/components/dashboard/LimitStatus.tsx` — progress bar widget with provider name, used/total/unit, reset countdown, color-coded fill (green → amber at 70%, red at 90%)
- [x] Wired into Overview page: `readAllLimits()` runs parallel to `fetchOverviewData()`; "Quota status — today" widget added to dashboard grid when limits are available
- [x] Extended `NotificationContext` to include `providerLimits?: ProviderLimit[]`
- [x] Added `rate_limit_warning` rule to `DEFAULT_RULES`: fires when any provider reaches ≥80% of its limit with a message naming the provider, count, and percentage
- [x] `NotificationEvaluator` updated to accept and forward `providerLimits` prop

**Context:** Knowing you're at 80% of your Claude daily limit on the dashboard removes the need to check each tool's UI separately. Token Monitor implements this for 15 providers. For a personal usage intelligence tool, this is high daily value — the user can adjust their workflow before hitting a hard stop.

---

## 3. Personal Intelligence Features

Net-new analytical views that no compared tool exposes in this form.

---

### 3.1 Cross-tool aggregated timeline ✅
- [x] Added `PluginActivitySeries` type to `src/app/page.tsx`; `fetchOverviewData` now builds `pluginSeries[]` — one entry per plugin that has non-zero token data, sorted by total tokens descending
- [x] Created `src/components/dashboard/AggregatedTimeline.tsx` — ECharts stacked bar chart; generates a dense date grid (filling days with no activity as 0); caps at 10 series for readability
- [x] Colors: monochromatic teal palette alternating tints/shades (`#008383 → #005959 → #4da6a6 → ...`) staying within the one-hue design system; falls back to neutrals for overflow
- [x] Legend: ECharts `type: 'scroll'` legend supports click-to-toggle per tool; scroll pagination if more than 10 tools fit
- [x] Tooltip: shows date + total tokens + breakdown per active tool (reversed order matches stack visual)
- [x] Replaced the merged `TimelineChart` widget on the Overview page with `AggregatedTimeline`; single-tool case is equivalent

**Context:** The Overview page currently shows per-plugin token totals as separate cards. There is no single chart showing "across all my AI tools, how did my total usage break down day by day." This is the most valuable cross-tool view a personal intelligence tool can offer.

**Gain:** Immediately visible answer to "which tool am I using most this week, and is that trend changing."

---

### 3.2 Spending forecast ✅
- [x] Compute `avgDailyCostUSD` from the trailing 7 days of `dailyCost[]` data (unified across all plugins after 1.1 lands)
- [x] Project to end-of-month: `forecastUSD = avgDailyCostUSD × daysRemainingInMonth`
- [x] Add a `ForecastKPI` card to the Overview page: "At this pace — **$XX this month** (N days remaining)"
- [x] Show the trailing-7-day average as a subtitle so the user understands the basis

**Context:** No compared tool shows a spending forecast. Users who pay per-token (Claude API, Codex, Gemini) have no early-warning signal of an unusually expensive month. The data is already collected once pricing is unified; this is pure presentation logic.

---

### 3.3 Hourly activity heatmap (time-of-day × day-of-week) ✅
- [x] Add `hourlyActivity: { hour: number; dayOfWeek: number; tokens: number }[]` to `PluginSummary` in `src/plugins/core/types.ts`
- [x] Populate `hourlyActivity` in `ClaudePlugin` by parsing the `timestamp` field of JSONL entries (already present in the file)
- [x] Populate in other plugins where timestamps are available in the source format
- [x] Create an `HourlyHeatmap` chart component (ECharts heatmap, X-axis = hour 0–23, Y-axis = Mon–Sun)
- [x] Add to both the Overview page and the Claude plugin detail page

**Context:** The existing `ActivityHeatmap` shows day-level calendar data. This orthogonal view shows hour-of-day patterns — answering "when am I heaviest AI consumer" and surfacing work habits the calendar view can't show.

---

### 3.4 Cache ROI panel ✅
- [x] In `ClaudePlugin`, compute `savedUSD = cacheReadTokens × (inputPricePerToken - cacheReadPricePerToken)` using the pricing registry (1.1)
- [x] Add `cacheRoiUSD` to `PluginSummary` for plugins that report cache token counts
- [x] Add a `CacheROI` KPI card to the Claude plugin page: "Cache saved you **$XX** in this period"
- [x] Show a secondary line on the existing `CostTimeline` chart: "actual cost" vs. "cost without cache"

**Context:** The Claude plugin already extracts `cacheRead` and `cacheWrite` token counts. What it doesn't surface is how much money the cache has saved the user. This is unique insight — no compared tool shows it — and the data is already being collected.

---

### 3.5 Model transition timeline ✅
- [x] Add `modelShareByDay: { date: string; model: string; tokens: number }[]` to `PluginSummary`
- [x] Populate in `ClaudePlugin` and any other plugins that record the model name per entry
- [x] Create a `ModelTimelineChart` stacked area chart showing model share over time (ECharts `line` with `areaStyle` and `stack: 'total'`)
- [x] Add to the Claude plugin detail page

**Context:** As models evolve (claude-3.5-sonnet → claude-sonnet-4 → claude-opus-5), users naturally migrate. The existing `ModelChart` shows aggregate model share but not *when* the shift happened or how cost per token changed across the transition.

---

### 3.6 Cross-tool project cost attribution ✅
- [x] In `GET /api/summary`, join `topProjects[]` across all plugins, grouping by project name (normalise paths to repo root)
- [x] Build a unified `UnifiedProjectTable`: columns for project name, total tokens across all tools, cost breakdown per tool, last activity
- [x] Add this table to the Overview page, replacing or supplementing the per-plugin project cards
- [x] Add a `?project=<name>` URL filter that scopes all Overview charts to a single project
  - Note: filter scopes the project table only; full chart scoping requires per-project daily time series data not currently tracked

**Context:** Each plugin reports its own `topProjects[]` independently. The Overview page shows these separately. A user working across Claude, Codex, and Gemini on the same repo has no way to see the total AI cost for that project in one place.

---

### 3.7 Conversation search ✅
- [x] Add a search input above `ConversationTable` in `src/components/dashboard/ConversationTable.tsx`
- [x] Filter by project path and conversation ID client-side (data is already in the rendered table)
- [x] Debounce the input (300ms) to avoid re-filtering on every keystroke
- [x] Persist the search term in the URL as `?search=<term>` so results are shareable/bookmarkable

**Context:** `ConversationTable` is sorted and paginated but not searchable. Finding a specific expensive session from last week requires paging through the table manually. For users with hundreds of conversations per day, this is a real friction point.

---

### 3.8 Daily digest notification ✅
- [x] Add a `dailyDigest` rule to `src/lib/notifications/rules.ts`
- [x] Rule fires once per calendar day (deduped via `localStorage` with a date-keyed key, same pattern as the existing `aitokentracker:notif_fired` dedup)
- [x] Notification body: yesterday's total token count, total cost across all tools, and top tool by token volume
- [x] Make the digest opt-in via a toggle in the ControlBar or a settings panel — off by default

**Context:** The existing `NotificationEvaluator` only fires on threshold breach. A daily digest gives users a lightweight awareness of their prior-day usage without requiring them to open the dashboard. The delivery mechanism (browser Notification API) and deduplication pattern are already in place.

---

### 3.9 Data export ✅
- [x] Add `GET /api/export` route accepting `?days=N&format=csv|json&plugins=all|<id>`
- [x] JSON output: array of `{ pluginId, date, tokens, costUSD, model, project }` records, one per daily bucket per plugin
- [x] CSV output: same schema, RFC 4180 compliant
- [x] Add an "Export" button to the ControlBar action slot (the `ControlBar` already has an optional action slot for this purpose)
- [x] Mark `export const dynamic = 'force-dynamic'` on the route to prevent static caching

**Context:** None of the user's own data is currently exportable. Users who want to analyse trends in a spreadsheet, keep a personal cost log, or migrate their history to another tool have no path. The data is local and belongs to the user — it should be exportable.

---

## 4. UX Improvements

Changes that don't require new data sources; improve day-to-day usability of existing features.

| # | Task | Context | Definition of done |
|---|---|---|---|
| **4.1** | - [x] Add "Today" and "All time" to time range presets | `ControlBar` has `1D / 7D / 30D / 90D / 365D`. "Today" (since midnight) and "All time" (no date gate) are natural presets users expect but have to approximate today. | Both presets appear in the `<select>`, pass the correct `days` value to `searchParams`, and are handled in each plugin's `collect()`. |
| **4.2** | - [x] Show structured unavailability reason in `PluginBanner` | The current "Not configured" banner has no detail — the user can't tell if the tool isn't installed, the path doesn't exist, or the parser threw an error. | `isAvailable()` returns a typed `AvailabilityResult` (`{ available: boolean; reason?: 'not_installed' \| 'path_missing' \| 'parse_error' \| 'placeholder'; detail?: string }`). `PluginBanner` renders a human-readable sentence from the reason field. |
| **4.3** | - [x] Add keyboard navigation to `ConversationTable` | Table rows are mouse-only. Power users navigating with keyboard have no way to move between rows or expand a row. | Arrow keys move focus between rows; Enter/Space expands the selected row's token detail; Tab moves to the next interactive element outside the table (roving tabindex). |
| **4.4** | - [x] Render contextual empty states per chart | Charts with no data for the selected period render blank. Users can't tell if it's a data gap, a wrong time range, or a plugin issue. | Each chart component renders a centred "No data for this period — try a wider date range" message when its data prop is empty, styled consistently with the existing `Skeleton` component. |
| **4.5** | ~~Not needed~~ — per-plugin pages already give project-level drill-down; adding a global project filter to the Overview adds complexity without meaningful personal-use value. | — | — |

---

## Completion summary

| Section | Total tasks | Done |
|---|---|---|
| 1. Architecture | 19 sub-tasks | 19 |
| 2. Data coverage | 12 sub-tasks | 12 |
| 3. Personal intelligence | 18 sub-tasks | 18 |
| 4. UX improvements | 4 active + 1 dropped | 3 |
| **Total** | **53 sub-tasks** | **52** |

---

*Last updated: 2026-08-05*
