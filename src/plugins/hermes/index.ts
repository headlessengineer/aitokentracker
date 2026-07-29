import * as path from 'path'
import * as os from 'os'
import * as fsSync from 'fs'
import type { DatabaseSync } from 'node:sqlite'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const HERMES_HOME = process.env.HERMES_HOME ?? path.join(os.homedir(), '.hermes')
const DB_PATH = path.join(HERMES_HOME, 'state.db')

interface HermesRow {
  id: unknown
  model: unknown
  started_at: unknown
  message_count: unknown
  input_tokens: unknown
  output_tokens: unknown
  cache_read_tokens: unknown
  cache_write_tokens: unknown
}

async function readHermes(cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(DB_PATH)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true })
    const rows = db.prepare(
      `SELECT id, model, started_at, message_count, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens
       FROM sessions
       WHERE model IS NOT NULL AND TRIM(model) != ''
         AND (COALESCE(input_tokens,0) > 0 OR COALESCE(output_tokens,0) > 0)`
    ).all() as unknown as HermesRow[]

    const conversations: ConversationSummary[] = []
    for (const row of rows) {
      const startedAt = typeof row.started_at === 'number'
        ? new Date(row.started_at > 1e12 ? row.started_at : row.started_at * 1000)
        : new Date(String(row.started_at))
      if (startedAt < cutoff) continue

      const input = Number(row.input_tokens ?? 0)
      const output = Number(row.output_tokens ?? 0)
      const cacheRead = Number(row.cache_read_tokens ?? 0)
      const cacheWrite = Number(row.cache_write_tokens ?? 0)
      const total = input + output + cacheRead + cacheWrite

      conversations.push({
        id: String(row.id ?? ''),
        project: 'hermes',
        messageCount: Number(row.message_count ?? 0),
        tokens: { input, output, cacheRead, cacheWrite, total },
        model: String(row.model ?? 'unknown'),
        lastActivity: startedAt,
        created: startedAt,
        status: convStatus(startedAt),
      })
    }
    return conversations
  } catch {
    return []
  } finally {
    try { db?.close() } catch {}
  }
}

const HERMES_PLUGIN: TokenPlugin = {
  id: 'hermes',
  name: 'Hermes',
  icon: 'Hm',
  description: 'Tracks token usage from Hermes Agent sessions (~/.hermes/state.db)',
  dataPath: DB_PATH,

  async isAvailable(): Promise<boolean> {
    return pathExists(DB_PATH)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)
    const conversations = await readHermes(cutoff)
    return buildPluginData('hermes', conversations, options)
  },
}

export default HERMES_PLUGIN
