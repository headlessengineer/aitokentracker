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

const GROK_HOME = process.env.GROK_HOME ?? path.join(os.homedir(), '.grok')
const SESSIONS_DIR = path.join(GROK_HOME, 'sessions')

interface GrokUpdate {
  totalTokens?: number
  model?: string
  timestamp?: number | string
}

interface GrokSignals {
  totalTokensBeforeCompaction?: number
  contextTokensUsed?: number
  model?: string
  timestamp?: number | string
}

async function parseGrokSession(sessionDir: string, cutoff: Date): Promise<ConversationSummary | null> {
  const updatesFile = path.join(sessionDir, 'updates.jsonl')
  const signalsFile = path.join(sessionDir, 'signals.json')

  let stat: Awaited<ReturnType<typeof fs.stat>>
  try { stat = await fs.stat(updatesFile) } catch {
    // Try signals.json only
    try {
      const signalsStat = await fs.stat(signalsFile)
      if (signalsStat.mtime < cutoff) return null
      const raw = await fs.readFile(signalsFile, 'utf-8')
      const signals = JSON.parse(raw) as GrokSignals
      const total = signals.totalTokensBeforeCompaction ?? signals.contextTokensUsed ?? 0
      if (total === 0) return null
      const ts = signals.timestamp
        ? (typeof signals.timestamp === 'number' ? new Date(signals.timestamp) : new Date(signals.timestamp))
        : signalsStat.mtime
      return {
        id: path.basename(sessionDir),
        project: path.basename(path.dirname(sessionDir)),
        messageCount: 1,
        tokens: { input: total, output: 0, cacheRead: 0, cacheWrite: 0, total },
        model: signals.model ?? 'grok',
        lastActivity: ts,
        created: ts,
        status: convStatus(ts),
      }
    } catch { return null }
  }
  if (stat.mtime < cutoff) return null

  let raw: string
  try { raw = await fs.readFile(updatesFile, 'utf-8') } catch { return null }

  let prevTotal = 0
  let deltaInput = 0
  let model = 'grok'
  let lastTs = stat.mtime.getTime()

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    let obj: GrokUpdate
    try { obj = JSON.parse(line) as GrokUpdate } catch { continue }

    const total = obj.totalTokens ?? 0
    if (total > prevTotal) {
      deltaInput += total - prevTotal
    }
    prevTotal = Math.max(prevTotal, total)
    if (obj.model && obj.model !== 'grok') model = obj.model
    if (obj.timestamp) {
      const ts = typeof obj.timestamp === 'number' ? obj.timestamp : new Date(obj.timestamp).getTime()
      if (ts > lastTs) lastTs = ts
    }
  }

  // Also add any compaction leftover from signals.json
  try {
    const sigRaw = await fs.readFile(signalsFile, 'utf-8')
    const signals = JSON.parse(sigRaw) as GrokSignals
    const compactionTotal = signals.totalTokensBeforeCompaction ?? 0
    if (compactionTotal > prevTotal) {
      deltaInput += compactionTotal - prevTotal
    }
    if (signals.model) model = signals.model
  } catch { /* no signals file */ }

  if (deltaInput === 0) return null

  const lastActivity = new Date(lastTs)
  return {
    id: path.basename(sessionDir),
    project: path.basename(path.dirname(sessionDir)),
    messageCount: 1,
    tokens: { input: deltaInput, output: 0, cacheRead: 0, cacheWrite: 0, total: deltaInput },
    model,
    lastActivity,
    created: stat.mtime,
    status: convStatus(lastActivity),
  }
}

const GROK_PLUGIN: TokenPlugin = {
  id: 'grok',
  name: 'Grok Build',
  icon: 'Gk',
  description: 'Tracks token usage from Grok Build AI coding sessions (~/.grok/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(SESSIONS_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    let workspaceDirs: string[]
    try { workspaceDirs = await fs.readdir(SESSIONS_DIR) } catch { return emptyPluginData('grok') }

    const conversations: ConversationSummary[] = []

    for (const wsName of workspaceDirs) {
      const wsPath = path.join(SESSIONS_DIR, wsName)
      let wsEntry: Awaited<ReturnType<typeof fs.stat>>
      try { wsEntry = await fs.stat(wsPath) } catch { continue }
      if (!wsEntry.isDirectory()) continue

      let sessionDirs: string[]
      try { sessionDirs = await fs.readdir(wsPath) } catch { continue }

      for (const sessionName of sessionDirs) {
        const sessionPath = path.join(wsPath, sessionName)
        let sessEntry: Awaited<ReturnType<typeof fs.stat>>
        try { sessEntry = await fs.stat(sessionPath) } catch { continue }
        if (!sessEntry.isDirectory()) continue

        const conv = await parseGrokSession(sessionPath, cutoff)
        if (conv) conversations.push(conv)
      }
    }

    return buildPluginData('grok', conversations, options)
  },
}

export default GROK_PLUGIN
