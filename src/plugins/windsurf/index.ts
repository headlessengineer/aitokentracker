import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,
  AvailabilityResult,
} from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

// ── Paths ──────────────────────────────────────────────────────────────────

// Windsurf is a VS Code fork; its extension storage follows VS Code conventions.
// On macOS the data directory is under Library/Application Support, not ~/.config.
const GLOBAL_STORAGE = process.platform === 'darwin'
  ? path.join(os.homedir(), 'Library', 'Application Support', 'Windsurf', 'User', 'globalStorage')
  : path.join(os.homedir(), '.config', 'Windsurf', 'User', 'globalStorage')

// ── Cline-style task parser ─────────────────────────────────────────────────
// Cline, Roo Code, Kilo Code (and forks) all store per-task data as
// <globalStorage>/<extension-id>/tasks/<uuid>/ui_messages.json.
// Each ui_messages.json is a JSON array of message objects; API usage is
// embedded in entries where say === 'api_req_started'.

interface ApiReqPayload {
  tokensIn?: number
  tokensOut?: number
  cacheReads?: number
  cacheWrites?: number
}

interface UiMessage {
  type?: string
  say?: string
  text?: string
  ts?: number
}

async function parseTaskDir(
  taskDir: string,
  cutoff: Date,
  extensionId: string,
): Promise<ConversationSummary | null> {
  const msgFile = path.join(taskDir, 'ui_messages.json')
  let stat: Awaited<ReturnType<typeof fs.stat>>
  try { stat = await fs.stat(msgFile) } catch { return null }
  if (stat.mtime < cutoff) return null

  let raw: string
  try { raw = await fs.readFile(msgFile, 'utf-8') } catch { return null }
  let entries: UiMessage[]
  try { entries = JSON.parse(raw) as UiMessage[] } catch { return null }

  let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheWrite = 0, messageCount = 0
  for (const entry of entries) {
    if (entry.type !== 'say' || entry.say !== 'api_req_started' || !entry.text) continue
    let payload: ApiReqPayload
    try { payload = JSON.parse(entry.text) as ApiReqPayload } catch { continue }
    inputTokens += payload.tokensIn ?? 0
    outputTokens += payload.tokensOut ?? 0
    cacheRead += payload.cacheReads ?? 0
    cacheWrite += payload.cacheWrites ?? 0
    messageCount++
  }
  if (inputTokens + outputTokens === 0 && messageCount === 0) return null

  const total = inputTokens + outputTokens + cacheRead + cacheWrite
  return {
    id: `${extensionId}:${path.basename(taskDir)}`,
    project: extensionId,
    messageCount,
    tokens: { input: inputTokens, output: outputTokens, cacheRead, cacheWrite, total },
    model: 'claude-sonnet',
    lastActivity: stat.mtime,
    created: stat.mtime,
    status: convStatus(stat.mtime),
  }
}

async function collectFromExtension(
  extDir: string,
  extensionId: string,
  cutoff: Date,
): Promise<ConversationSummary[]> {
  const tasksDir = path.join(extDir, 'tasks')
  let taskDirs: string[]
  try { taskDirs = await fs.readdir(tasksDir) } catch { return [] }

  const results: ConversationSummary[] = []
  for (const d of taskDirs) {
    const conv = await parseTaskDir(path.join(tasksDir, d), cutoff, extensionId)
    if (conv) results.push(conv)
  }
  return results
}

// ── Plugin definition ───────────────────────────────────────────────────────

const WINDSURF_PLUGIN: TokenPlugin = {
  id: 'windsurf',
  name: 'Windsurf',
  icon: 'W',
  description: 'Tracks token usage from AI coding extensions (Cline, Roo Code, Kilo Code) installed in Windsurf IDE',
  dataPath: GLOBAL_STORAGE,
  capabilities: {
    cost: true,
    models: false, // model names are not reliably available from ui_messages.json
    projects: false,
    sessions: true,
    rateLimit: false,
  },

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(GLOBAL_STORAGE))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    // Enumerate all extension directories and look for those that have a tasks/ subdir
    let extensionDirs: string[]
    try { extensionDirs = await fs.readdir(GLOBAL_STORAGE) } catch { return emptyPluginData('windsurf') }

    const conversations: ConversationSummary[] = []
    for (const extId of extensionDirs) {
      const extPath = path.join(GLOBAL_STORAGE, extId)
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(extPath) } catch { continue }
      if (!stat.isDirectory()) continue

      const convs = await collectFromExtension(extPath, extId, cutoff)
      conversations.push(...convs)
    }

    if (conversations.length === 0) return emptyPluginData('windsurf')
    return buildPluginData('windsurf', conversations, options)
  },
}

export default WINDSURF_PLUGIN
