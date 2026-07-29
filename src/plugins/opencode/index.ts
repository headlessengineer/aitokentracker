import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import type { DatabaseSync } from 'node:sqlite'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, globFiles, pathExists, convStatus } from '../core/collect'

const XDG_DATA = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
const MSG_DIR = path.join(XDG_DATA, 'opencode', 'storage', 'message')
const DB_PATH = path.join(XDG_DATA, 'opencode', 'opencode.db')
const DATA_DIR = path.join(XDG_DATA, 'opencode')

interface OpenCodeTokens {
  input: number
  output: number
  reasoning?: number
  cache: { read: number; write: number }
}
interface OpenCodeMsg {
  id?: string
  sessionID?: string
  role: string
  modelID?: string
  tokens?: OpenCodeTokens
  time: { created: number; completed?: number }
  path?: { root?: string }
}

async function readFromSqlite(dbPath: string, cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(dbPath)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(dbPath, { readOnly: true })
    const rows = db.prepare(
      `SELECT session_id, data FROM message WHERE json_extract(data,'$.role')='assistant' AND json_extract(data,'$.tokens') IS NOT NULL ORDER BY rowid`
    ).all() as Array<{ session_id: string; data: string }>

    const sessionMap = new Map<string, { convs: ConversationSummary; lastTs: number }>()

    for (const row of rows) {
      let msg: OpenCodeMsg
      try { msg = JSON.parse(row.data) as OpenCodeMsg } catch { continue }
      if (!msg.tokens) continue
      const ts = msg.time.created > 1e12 ? msg.time.created : msg.time.created * 1000
      const lastActivity = new Date(ts)
      if (lastActivity < cutoff) continue

      const sessionId = row.session_id
      const project = msg.path?.root ? path.basename(msg.path.root) : 'Unknown'
      const tokens = msg.tokens
      const total = tokens.input + tokens.output + (tokens.reasoning ?? 0) + tokens.cache.read + tokens.cache.write

      const existing = sessionMap.get(sessionId)
      if (existing) {
        existing.convs.tokens.input += tokens.input
        existing.convs.tokens.output += tokens.output
        existing.convs.tokens.cacheRead += tokens.cache.read
        existing.convs.tokens.cacheWrite += tokens.cache.write
        existing.convs.tokens.total += total
        existing.convs.messageCount += 1
        if (ts > existing.lastTs) {
          existing.lastTs = ts
          existing.convs.lastActivity = lastActivity
          existing.convs.status = convStatus(lastActivity)
        }
      } else {
        sessionMap.set(sessionId, {
          lastTs: ts,
          convs: {
            id: sessionId,
            project,
            messageCount: 1,
            tokens: { input: tokens.input, output: tokens.output, cacheRead: tokens.cache.read, cacheWrite: tokens.cache.write, total },
            model: msg.modelID ?? 'unknown',
            lastActivity,
            created: lastActivity,
            status: convStatus(lastActivity),
          },
        })
      }
    }
    return [...sessionMap.values()].map((v) => v.convs)
  } catch {
    return []
  } finally {
    try { db?.close() } catch {}
  }
}

async function readFromJson(dir: string, cutoff: Date): Promise<ConversationSummary[]> {
  const files = await globFiles(dir, '.json')
  const sessionMap = new Map<string, { convs: ConversationSummary; lastTs: number }>()

  for (const file of files) {
    let raw: string
    try { raw = await fs.readFile(file, 'utf-8') } catch { continue }
    let msg: OpenCodeMsg
    try { msg = JSON.parse(raw) as OpenCodeMsg } catch { continue }
    if (msg.role !== 'assistant' || !msg.tokens) continue

    const ts = msg.time.created > 1e12 ? msg.time.created : msg.time.created * 1000
    const lastActivity = new Date(ts)
    if (lastActivity < cutoff) continue

    const sessionId = msg.sessionID ?? path.basename(file, '.json')
    const project = msg.path?.root ? path.basename(msg.path.root) : 'Unknown'
    const tokens = msg.tokens
    const total = tokens.input + tokens.output + (tokens.reasoning ?? 0) + tokens.cache.read + tokens.cache.write

    const existing = sessionMap.get(sessionId)
    if (existing) {
      existing.convs.tokens.input += tokens.input
      existing.convs.tokens.output += tokens.output
      existing.convs.tokens.cacheRead += tokens.cache.read
      existing.convs.tokens.cacheWrite += tokens.cache.write
      existing.convs.tokens.total += total
      existing.convs.messageCount += 1
      if (ts > existing.lastTs) {
        existing.lastTs = ts
        existing.convs.lastActivity = lastActivity
        existing.convs.status = convStatus(lastActivity)
      }
    } else {
      sessionMap.set(sessionId, {
        lastTs: ts,
        convs: {
          id: sessionId,
          project,
          messageCount: 1,
          tokens: { input: tokens.input, output: tokens.output, cacheRead: tokens.cache.read, cacheWrite: tokens.cache.write, total },
          model: msg.modelID ?? 'unknown',
          lastActivity,
          created: lastActivity,
          status: convStatus(lastActivity),
        },
      })
    }
  }
  return [...sessionMap.values()].map((v) => v.convs)
}

const OPENCODE_PLUGIN: TokenPlugin = {
  id: 'opencode',
  name: 'OpenCode',
  icon: 'Oc',
  description: 'Tracks token usage from OpenCode AI coding sessions (~/.local/share/opencode)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(DB_PATH) || pathExists(MSG_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    // Prefer SQLite if it exists
    if (fsSync.existsSync(DB_PATH)) {
      const conversations = await readFromSqlite(DB_PATH, cutoff)
      if (conversations.length > 0) return buildPluginData('opencode', conversations, options)
    }

    if (!(await pathExists(MSG_DIR))) return emptyPluginData('opencode')
    const conversations = await readFromJson(MSG_DIR, cutoff)
    return buildPluginData('opencode', conversations, options)
  },
}

export default OPENCODE_PLUGIN
