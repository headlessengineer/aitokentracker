---
title: Client Data Sources Reference
date: 2026-07-14
version: 1.0
---

# Client Data Sources Reference

tokscale tracks 39 AI coding tool clients defined in `clients.rs`. Each client specifies a canonical ID, a data directory resolved from a `PathRoot` enum variant plus a relative path, a file pattern, and a wire format. This document is the authoritative quick reference for those definitions.

> **Note:** `$XDG_DATA_HOME` defaults to `~/.local/share` when unset. `$TOKSCALE_CONFIG_DIR` defaults to `~/.config/tokscale` on Linux/macOS when unset.

## Table of Contents

- [Summary by Format](#summary-by-format)
- [JSONL Clients](#jsonl-clients)
- [JSON Clients](#json-clients)
- [SQLite Clients](#sqlite-clients)
- [CSV Clients](#csv-clients)
- [NDJSON Clients](#ndjson-clients)
- [AntigravityCli SQLite Schema](#antigravitycli-sqlite-schema)
- [Environment Variable Reference](#environment-variable-reference)

---

## Summary by Format

| Format | Count | Client IDs |
| :--- | :---: | :--- |
| JSONL | 16 | `claude`, `codex`, `gemini`, `openclaw`, `pi`, `kimi`, `qwen`, `copilot`, `antigravity`, `gjc`, `grok`, `commandcode`, `junie`, `zcode`, `opencodereview`, `codebuddy` |
| JSON | 14 | `opencode`, `amp`, `droid`, `roocode`, `kilocode`, `mux`, `kiro`, `trae`, `warp`, `cline`, `jcode`, `gemini` (mixed), `codebuff`, `workbuddy`* |
| SQLite | 7 | `kilo`, `crush`, `hermes`, `goose`, `zed`, `micode`, `antigravity-cli`, `workbuddy`, `devin-cli` |
| CSV | 1 | `cursor` |
| NDJSON | 1 | `devin-desktop` |

> **Note:** `gemini` accepts both `*.json` and `*.jsonl` files. `crush` is JSON for its registry file but each project is a separate SQLite `.db`. Counts reflect primary format.

---

## JSONL Clients

| idx | ID | Root | Resolved base | Relative path | Pattern | submit |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | `claude` | `$HOME` | `~` | `.claude/projects` | `*.jsonl` | yes |
| 2 | `codex` | `$CODEX_HOME` | `~/.codex` | `sessions` | `*.jsonl` | yes |
| 7 | `openclaw` | `$HOME` | `~` | `.openclaw/agents` | `*.jsonl*` | yes |
| 8 | `pi` | `$HOME` | `~` | `.pi/agent/sessions` | `*.jsonl` | yes |
| 9 | `kimi` | `$HOME` | `~` | `.kimi/sessions` | `wire.jsonl` | yes |
| 10 | `qwen` | `$HOME` | `~` | `.qwen/projects` | `*.jsonl` | yes |
| 17 | `copilot` | `$HOME` | `~` | `.copilot/otel` | `*.jsonl` | yes |
| 20 | `antigravity` | `$TOKSCALE_CONFIG_DIR` | `~/.config/tokscale` | `antigravity-cache/sessions` | `*.jsonl` | yes |
| 26 | `gjc` | `$GJC_CODING_AGENT_DIR` | `~/.gjc/agent` | `sessions` | `*.jsonl` | yes |
| 27 | `grok` | `$GROK_HOME` | `~/.grok` | `sessions` | `updates.jsonl` | yes |
| 29 | `commandcode` | `$HOME` | `~` | `.commandcode/projects` | `*.jsonl` | yes |
| 32 | `junie` | `$HOME` | `~` | `.junie/sessions` | `events.jsonl` | yes |
| 33 | `zcode` | `$HOME` | `~` | `.zcode/projects` | `*.jsonl` | yes |
| 34 | `opencodereview` | `$HOME` | `~` | `.opencodereview/sessions` | `*.jsonl` | yes |
| 35 | `codebuddy` | `$HOME` | `~` | `.codebuddy/projects` | `*.jsonl` | yes |

> **Note:** `antigravity` (index 20) is populated by `tokscale antigravity sync`, which runs every 5 minutes and pulls data from a running `agy` language server via gRPC-style HTTP (`antigravityProbe.js`). This is not a direct file parse — tokscale writes the JSONL cache from that RPC response.

---

## JSON Clients

| idx | ID | Root | Resolved base | Relative path | Pattern | submit |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 0 | `opencode` | `$XDG_DATA_HOME` | `~/.local/share` | `opencode/storage/message` | `*.json` | yes |
| 4 | `gemini` | `$GEMINI_CLI_HOME` | `~/.gemini` | `tmp` | `*.json` \| `*.jsonl` | yes |
| 5 | `amp` | `$XDG_DATA_HOME` | `~/.local/share` | `amp/threads` | `T-*.json` | yes |
| 6 | `droid` | `$HOME` | `~` | `.factory/sessions` | `*.settings.json` | yes |
| 11 | `roocode` | `$HOME` | `~` | `.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/tasks` | `ui_messages.json` | yes |
| 12 | `kilocode` | `$HOME` | `~` | `.config/Code/User/globalStorage/kilocode.kilo-code/tasks` | `ui_messages.json` | yes |
| 13 | `mux` | `$HOME` | `~` | `.mux/sessions` | `session-usage.json` | yes |
| 15 | `crush` | `$XDG_DATA_HOME` | `~/.local/share` | `crush/projects.json` | `projects.json` | no |
| 19 | `codebuff` | `$CODEBUFF_DATA_DIR` | `~/.config/manicode` | `projects` | `chat-messages.json` | yes |
| 22 | `kiro` | `$HOME` | `~` | `.kiro/sessions/cli` | `*.json` | yes |
| 23 | `trae` | `$TOKSCALE_CONFIG_DIR` | `~/.config/tokscale` | `trae-cache/sessions` | `*.json` | no |
| 24 | `warp` | `$TOKSCALE_CONFIG_DIR` | `~/.config/tokscale` | `warp-cache` | `usage*.json` | no |
| 25 | `cline` | `$HOME` | `~` | `.config/Code/User/globalStorage/saoudrizwan.claude-dev/tasks` | `ui_messages.json` | yes |
| 28 | `jcode` | `$JCODE_HOME` | `~/.jcode` | `sessions` | `session_*.json` | yes |

> **Note:** `crush` (index 15) uses `projects.json` as a registry; each project entry points to a separate `crush.db` SQLite file. The registry is JSON but the actual usage data is SQLite. `submit_default` is `no`. `trae` and `warp` are synced caches managed by tokscale — not parsed from local tool files directly.

> **Note:** `roocode`, `kilocode`, and `cline` are VS Code extension clients. Their data lives under VS Code's `globalStorage` directory, keyed by extension publisher ID.

---

## SQLite Clients

| idx | ID | Root | Resolved base | Relative path | Pattern | submit |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 14 | `kilo` | `$XDG_DATA_HOME` | `~/.local/share` | `kilo` | `kilo.db` | yes |
| 15 | `crush` | `$XDG_DATA_HOME` | `~/.local/share` | `crush` | `crush.db` (per-project) | no |
| 16 | `hermes` | `$HERMES_HOME` | `~/.hermes` | — | `state.db` | yes |
| 18 | `goose` | `$XDG_DATA_HOME` | `~/.local/share` | `goose/sessions` | `sessions.db` | yes |
| 21 | `zed` | `$XDG_DATA_HOME` | `~/.local/share` | `zed/threads` | `threads.db` | yes |
| 30 | `micode` | `$XDG_DATA_HOME` | `~/.local/share` | `mimocode` | `*.db` | yes |
| 31 | `antigravity-cli` | `$GEMINI_CLI_HOME` | `~/.gemini` | `antigravity-cli/conversations` | `*.db` | yes |
| 36 | `workbuddy` | `$HOME` | `~` | `.workbuddy` | `workbuddy.db` | yes |
| 37 | `devin-cli` | `$XDG_DATA_HOME` | `~/.local/share` | `devin/cli` | `sessions.db` | yes |

> **Note:** `antigravity-cli` (index 31) stores one `.db` file per conversation. Token data is encoded as protobuf binary blobs — see [AntigravityCli SQLite Schema](#antigravitycli-sqlite-schema) below.

---

## CSV Clients

| idx | ID | Root | Resolved base | Relative path | Pattern | submit |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 3 | `cursor` | `$HOME` | `~` | `.config/tokscale/cursor-cache` | `usage*.csv` | yes |

> **Note:** tokscale does not parse local Cursor files directly. The CSV cache at `~/.config/tokscale/cursor-cache/` is written by tokscale's own sync process.

---

## NDJSON Clients

| idx | ID | Root | Resolved base | Relative path | Pattern | submit |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 38 | `devin-desktop` | `$HOME` | `~` | `Library/Application Support/Devin/User/acp-events` | `*.ndjson` | yes |

> **Note:** macOS only. Path is under `~/Library/Application Support/`, which is the standard macOS app data location.

---

## AntigravityCli SQLite Schema

Each conversation for `antigravity-cli` is a standalone SQLite database at:

```
~/.gemini/antigravity-cli/conversations/<id>.db
```

### Relevant tables

**`gen_metadata`** — one row per generation/turn:

| Column | Type | Notes |
| :--- | :--- | :--- |
| `data` | `BLOB` | Protobuf-encoded binary. Contains token counts (input, output, cache read/write). Decoded by tokscale at parse time. |

**`steps`** — conversation steps/events:

| Column | Type | Notes |
| :--- | :--- | :--- |
| `step_type` | `INTEGER` | `14` = `USER_INPUT`. Used to identify turn boundaries and match generations to user messages. |

tokscale reads both tables in a join to reconstruct per-turn token usage. No RPC or sync step is required — the `.db` files are written directly by the `agy` CLI process.

---

## Environment Variable Reference

| Variable | Default | Used by |
| :--- | :--- | :--- |
| `XDG_DATA_HOME` | `~/.local/share` | `opencode`, `amp`, `kilo`, `crush`, `goose`, `zed`, `micode`, `devin-cli` |
| `TOKSCALE_CONFIG_DIR` | `~/.config/tokscale` | `antigravity`, `trae`, `warp` |
| `GEMINI_CLI_HOME` | `~/.gemini` | `gemini`, `antigravity-cli` |
| `CODEX_HOME` | `~/.codex` | `codex` |
| `HERMES_HOME` | `~/.hermes` | `hermes` |
| `CODEBUFF_DATA_DIR` | `~/.config/manicode` | `codebuff` |
| `GJC_CODING_AGENT_DIR` | `~/.gjc/agent` | `gjc` |
| `GROK_HOME` | `~/.grok` | `grok` |
| `JCODE_HOME` | `~/.jcode` | `jcode` |

Setting any of these overrides the default resolution for that client's `PathRoot`. Clients using `$HOME` are not overridable via env var — they always resolve to the OS home directory.
