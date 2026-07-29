import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import type { DatabaseSync } from 'node:sqlite'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const XDG_DATA = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
const DATA_DIR = path.join(XDG_DATA, 'mimocode')

interface MiCodeTokens {
  input: number
  output: number
  reasoning?: number
  cache: { read: number; write: number }
}

interface MiCodeMsg {
  role: string
  modelID?: string
  tokens?: MiCodeTokens
  time: { created: number }
  path?: { root?: string }
}

async function readMiCodeDb(dbPath: string, cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(dbPath)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(dbPath, { readOnly: true })
    const rows = db.prepare(
      `SELECT session_id, data FROM message WHERE json_extract(data,'$.role')='assistant' AND json_extract(data,'$.tokens') IS NOT NULL ORDER BY rowid`
    ).all() as Array<{ session_id: unknown; data: unknown }>

    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()

    for (const row of rows) {
      let msg: MiCodeMsg
      try { msg = JSON.parse(String(row.data ?? '')) as MiCodeMsg } catch { continue }
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

const MICODE_PLUGIN: TokenPlugin = {
  id: 'micode',
  name: 'MiMo Code',
  icon: 'Mi',
  description: 'Tracks token usage from MiMo Code AI sessions (~/.local/share/mimocode)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(DATA_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    let dbFiles: string[]
    try {
      const entries = await fs.readdir(DATA_DIR)
      dbFiles = entries
        .filter((e) => e.endsWith('.db') && !e.endsWith('-shm') && !e.endsWith('-wal'))
        .map((e) => path.join(DATA_DIR, e))
    } catch {
      return emptyPluginData('micode')
    }

    const conversations: ConversationSummary[] = []
    for (const dbPath of dbFiles) {
      conversations.push(...await readMiCodeDb(dbPath, cutoff))
    }

    if (conversations.length === 0) return emptyPluginData('micode')
    return buildPluginData('micode', conversations, options)
  },
}

export default MICODE_PLUGIN
