import * as path from 'path'
import * as os from 'os'
import * as fsSync from 'fs'
import type { DatabaseSync } from 'node:sqlite'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,
  AvailabilityResult,
} from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

const XDG_DATA = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
const DB_PATH = path.join(XDG_DATA, 'kilo', 'kilo.db')

interface KiloTokens {
  input: number
  output: number
  reasoning?: number
  cache: { read: number; write: number }
}

interface KiloMsg {
  role: string
  modelID?: string
  providerID?: string
  tokens?: KiloTokens
  time: { created: number; completed?: number }
  path?: { root?: string }
}

async function readKilo(cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(DB_PATH)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true })
    const rows = db.prepare(
      `SELECT session_id, data FROM message WHERE json_extract(data,'$.role')='assistant' AND json_extract(data,'$.tokens') IS NOT NULL ORDER BY rowid`
    ).all() as Array<{ session_id: unknown; data: unknown }>

    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()

    for (const row of rows) {
      let msg: KiloMsg
      try { msg = JSON.parse(String(row.data ?? '')) as KiloMsg } catch { continue }
      if (!msg.tokens) continue
      const ts = msg.time.created > 1e12 ? msg.time.created : msg.time.created * 1000
      const lastActivity = new Date(ts)
      if (lastActivity < cutoff) continue

      const sessionId = String(row.session_id ?? 'unknown')
      const tokens = msg.tokens
      const input = Math.max(0, tokens.input)
      const output = Math.max(0, tokens.output)
      const cacheRead = Math.max(0, tokens.cache.read)
      const cacheWrite = Math.max(0, tokens.cache.write)
      const total = input + output + cacheRead + cacheWrite
      const project = msg.path?.root ? path.basename(msg.path.root) : 'Unknown'

      const existing = sessionMap.get(sessionId)
      if (existing) {
        existing.tokens.input += input
        existing.tokens.output += output
        existing.tokens.cacheRead += cacheRead
        existing.tokens.cacheWrite += cacheWrite
        existing.tokens.total += total
        existing.messageCount++
        if (ts > existing.lastTs) {
          existing.lastTs = ts
          existing.lastActivity = lastActivity
          existing.status = convStatus(lastActivity)
        }
      } else {
        sessionMap.set(sessionId, {
          id: sessionId,
          project,
          messageCount: 1,
          tokens: { input, output, cacheRead, cacheWrite, total },
          model: msg.modelID ?? 'unknown',
          lastActivity,
          created: lastActivity,
          status: convStatus(lastActivity),
          lastTs: ts,
        })
      }
    }

    return [...sessionMap.values()].map(({ lastTs: _lt, ...c }) => c)
  } catch {
    return []
  } finally {
    try { db?.close() } catch {}
  }
}

const KILO_PLUGIN: TokenPlugin = {
  id: 'kilo',
  name: 'Kilo',
  icon: 'Kl',
  description: 'Tracks token usage from Kilo AI coding sessions (~/.local/share/kilo/kilo.db)',
  dataPath: DB_PATH,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(DB_PATH))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)
    const conversations = await readKilo(cutoff)
    if (conversations.length === 0) return emptyPluginData('kilo')
    return buildPluginData('kilo', conversations, options)
  },
}

export default KILO_PLUGIN
