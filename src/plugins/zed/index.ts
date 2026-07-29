import * as path from 'path'
import * as os from 'os'
import * as fsSync from 'fs'
import type { DatabaseSync } from 'node:sqlite'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const XDG_DATA = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
const LINUX_DB = path.join(XDG_DATA, 'zed', 'threads', 'threads.db')
const MACOS_DB = path.join(os.homedir(), 'Library', 'Application Support', 'Zed', 'threads', 'threads.db')

interface ZedTokenUsage {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

interface ZedThread {
  model?: { provider?: string; model?: string }
  request_token_usage?: Record<string, ZedTokenUsage> | ZedTokenUsage[]
  cumulative_token_usage?: ZedTokenUsage
  imported?: boolean
  updated_at?: string
}

interface ZedRow {
  id: unknown
  updated_at: unknown
  created_at: unknown
  data_type: unknown
  data: unknown
}

function sumUsage(usageMap: Record<string, ZedTokenUsage> | ZedTokenUsage[]): ZedTokenUsage & { count: number } {
  const items = Array.isArray(usageMap) ? usageMap : Object.values(usageMap)
  let input = 0, output = 0, cacheWrite = 0, cacheRead = 0, count = 0
  for (const u of items) {
    const t = (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
    if (t <= 0) continue
    input += u.input_tokens ?? 0
    output += u.output_tokens ?? 0
    cacheWrite += u.cache_creation_input_tokens ?? 0
    cacheRead += u.cache_read_input_tokens ?? 0
    count++
  }
  return { input_tokens: input, output_tokens: output, cache_creation_input_tokens: cacheWrite, cache_read_input_tokens: cacheRead, count }
}

async function readZed(dbPath: string, cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(dbPath)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(dbPath, { readOnly: true })

    // Check which columns exist
    let hasCreatedAt = false
    try {
      const cols = db.prepare('PRAGMA table_info(threads)').all() as Array<{ name: unknown }>
      hasCreatedAt = cols.some((c) => c.name === 'created_at')
    } catch {}

    const query = hasCreatedAt
      ? 'SELECT id, updated_at, created_at, data_type, data FROM threads'
      : 'SELECT id, updated_at, NULL as created_at, data_type, data FROM threads'

    const rows = db.prepare(query).all() as unknown as ZedRow[]
    const conversations: ConversationSummary[] = []

    for (const row of rows) {
      // Only handle JSON data type (ZSTD requires external decompressor)
      if (String(row.data_type ?? '').toLowerCase() !== 'json') continue

      let thread: ZedThread
      try {
        const data = row.data
        const jsonStr = data instanceof Uint8Array
          ? Buffer.from(data).toString('utf-8')
          : String(data)
        thread = JSON.parse(jsonStr) as ZedThread
      } catch {
        continue
      }

      if (thread.imported) continue

      const provider = thread.model?.provider?.toLowerCase() ?? ''
      if (provider !== 'zed.dev') continue

      const model = thread.model?.model?.trim() ?? ''
      if (!model) continue

      const tsStr = String(row.created_at ?? row.updated_at ?? thread.updated_at ?? '')
      const lastActivity = tsStr ? new Date(tsStr) : new Date()
      if (lastActivity < cutoff) continue

      let input = 0, output = 0, cacheWrite = 0, cacheRead = 0, messageCount = 1

      if (thread.request_token_usage) {
        const summed = sumUsage(thread.request_token_usage as Record<string, ZedTokenUsage>)
        input = summed.input_tokens ?? 0
        output = summed.output_tokens ?? 0
        cacheWrite = summed.cache_creation_input_tokens ?? 0
        cacheRead = summed.cache_read_input_tokens ?? 0
        messageCount = summed.count || 1
      } else if (thread.cumulative_token_usage) {
        const u = thread.cumulative_token_usage
        input = u.input_tokens ?? 0
        output = u.output_tokens ?? 0
        cacheWrite = u.cache_creation_input_tokens ?? 0
        cacheRead = u.cache_read_input_tokens ?? 0
      }

      if (input + output + cacheRead + cacheWrite === 0) continue

      const total = input + output + cacheRead + cacheWrite
      conversations.push({
        id: String(row.id ?? ''),
        project: 'zed',
        messageCount,
        tokens: { input, output, cacheRead, cacheWrite, total },
        model,
        lastActivity,
        created: lastActivity,
        status: convStatus(lastActivity),
      })
    }

    return conversations
  } catch {
    return []
  } finally {
    try { db?.close() } catch {}
  }
}

const ZED_PLUGIN: TokenPlugin = {
  id: 'zed',
  name: 'Zed',
  icon: 'Zd',
  description: 'Tracks token usage from Zed hosted AI coding sessions',
  dataPath: LINUX_DB,

  async isAvailable(): Promise<boolean> {
    return pathExists(LINUX_DB) || pathExists(MACOS_DB)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)
    const dbPath = fsSync.existsSync(LINUX_DB) ? LINUX_DB : MACOS_DB
    const conversations = await readZed(dbPath, cutoff)
    if (conversations.length === 0) return emptyPluginData('zed')
    return buildPluginData('zed', conversations, options)
  },
}

export default ZED_PLUGIN
