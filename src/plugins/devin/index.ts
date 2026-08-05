import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
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
const CLI_DB = path.join(XDG_DATA, 'devin', 'cli', 'sessions.db')
const DESKTOP_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'Devin', 'User', 'acp-events')

interface DevinMetrics {
  input_tokens?: number
  output_tokens?: number
  cache_read_tokens?: number
  cache_creation_tokens?: number
}

interface DevinNodeMetadata {
  generation_model?: string
  num_tokens?: number
  metrics?: DevinMetrics
}

interface DevinChatMessage {
  role?: string
  metadata?: DevinNodeMetadata
}

interface DevinRow {
  row_id: unknown
  session_id: unknown
  chat_message: unknown
  created_at_ms: unknown
  session_model: unknown
  working_directory: unknown
}

function isRoutingMode(s: string): boolean {
  return s === 'adaptive'
}

async function readDevinCli(cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(CLI_DB)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(CLI_DB, { readOnly: true })
    const rows = db.prepare(`
      SELECT m.row_id, m.session_id, m.chat_message,
             m.created_at * 1000 AS created_at_ms,
             s.model AS session_model, s.working_directory
      FROM message_nodes m
      JOIN sessions s ON m.session_id = s.id
      ORDER BY m.row_id
    `).all() as unknown as DevinRow[]

    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()

    for (const row of rows) {
      const ts = Number(row.created_at_ms ?? 0) || Date.now()
      const lastActivity = new Date(ts)
      if (lastActivity < cutoff) continue

      let msg: DevinChatMessage
      try { msg = JSON.parse(String(row.chat_message ?? '{}')) as DevinChatMessage } catch { continue }
      if (msg.role !== 'assistant') continue

      const genModel = msg.metadata?.generation_model?.trim() ?? ''
      const sessionModel = String(row.session_model ?? '').trim()
      const model = (genModel || sessionModel) &&
        !isRoutingMode(genModel || sessionModel)
        ? (genModel || sessionModel)
        : ''
      if (!model) continue

      const metrics = msg.metadata?.metrics
      let input = 0, output = 0, cacheRead = 0, cacheWrite = 0

      if (metrics) {
        input = Math.max(0, metrics.input_tokens ?? 0)
        output = Math.max(0, metrics.output_tokens ?? 0)
        cacheRead = Math.max(0, metrics.cache_read_tokens ?? 0)
        cacheWrite = Math.max(0, metrics.cache_creation_tokens ?? 0)
      } else if (msg.metadata?.num_tokens) {
        output = Math.max(0, msg.metadata.num_tokens)
      }

      const sessionId = String(row.session_id ?? '')
      const workspace = String(row.working_directory ?? 'devin')
      const project = path.basename(workspace) || 'devin'
      const total = input + output + cacheRead + cacheWrite

      const existing = sessionMap.get(sessionId)
      if (existing) {
        existing.tokens.input += input
        existing.tokens.output += output
        existing.tokens.cacheRead += cacheRead
        existing.tokens.cacheWrite += cacheWrite
        existing.tokens.total += total
        existing.messageCount += 1
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
          model,
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

interface DesktopEvent {
  type?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
    inputTokens?: number
    outputTokens?: number
  }
  model?: string
  timestamp?: number | string
}

async function readDevinDesktop(cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(DESKTOP_DIR)) return []
  let files: string[]
  try { files = await fs.readdir(DESKTOP_DIR) } catch { return [] }

  const conversations: ConversationSummary[] = []

  for (const file of files) {
    if (!file.endsWith('.ndjson')) continue
    const filePath = path.join(DESKTOP_DIR, file)
    let stat: Awaited<ReturnType<typeof fs.stat>>
    try { stat = await fs.stat(filePath) } catch { continue }
    if (stat.mtime < cutoff) continue

    let raw: string
    try { raw = await fs.readFile(filePath, 'utf-8') } catch { continue }

    let input = 0, output = 0, model = '', lastTs = stat.mtime.getTime()

    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      let event: DesktopEvent
      try { event = JSON.parse(line) as DesktopEvent } catch { continue }

      if (!event.usage) continue
      const u = event.usage
      input += Math.max(0, u.input_tokens ?? u.inputTokens ?? 0)
      output += Math.max(0, u.output_tokens ?? u.outputTokens ?? 0)
      if (event.model && !model) model = event.model
      if (event.timestamp) {
        const ts = typeof event.timestamp === 'number' ? event.timestamp : new Date(event.timestamp).getTime()
        if (ts > lastTs) lastTs = ts
      }
    }

    if (input + output === 0) continue
    const lastActivity = new Date(lastTs)
    const total = input + output
    conversations.push({
      id: path.basename(file, '.ndjson'),
      project: 'devin-desktop',
      messageCount: 1,
      tokens: { input, output, cacheRead: 0, cacheWrite: 0, total },
      model: model || 'claude-3-5-sonnet',
      lastActivity,
      created: stat.mtime,
      status: convStatus(lastActivity),
    })
  }

  return conversations
}

const DEVIN_PLUGIN: TokenPlugin = {
  id: 'devin',
  name: 'Devin',
  icon: 'Dv',
  description: 'Tracks token usage from Devin AI sessions (CLI SQLite + Desktop NDJSON)',
  dataPath: CLI_DB,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(CLI_DB) || await pathExists(DESKTOP_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const cliConvs = await readDevinCli(cutoff)
    const desktopConvs = await readDevinDesktop(cutoff)
    const conversations = [...cliConvs, ...desktopConvs]

    if (conversations.length === 0) return emptyPluginData('devin')
    return buildPluginData('devin', conversations, options)
  },
}

export default DEVIN_PLUGIN
