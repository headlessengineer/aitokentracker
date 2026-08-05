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
const LINUX_DB = path.join(XDG_DATA, 'goose', 'sessions', 'sessions.db')
const MACOS_DB = path.join(os.homedir(), 'Library', 'Application Support', 'goose', 'sessions', 'sessions.db')
const DB_PATH = process.platform === 'darwin' && !fsSync.existsSync(LINUX_DB) ? MACOS_DB : LINUX_DB

interface GooseRow {
  id: unknown
  model_config_json: unknown
  created_at: unknown
  input_tokens: unknown
  output_tokens: unknown
}

function parseCreatedAt(s: string): Date {
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d
  // "YYYY-MM-DD HH:MM:SS" format
  const d2 = new Date(s.replace(' ', 'T') + 'Z')
  return isNaN(d2.getTime()) ? new Date() : d2
}

async function readGoose(dbPath: string, cutoff: Date): Promise<ConversationSummary[]> {
  if (!fsSync.existsSync(dbPath)) return []
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(dbPath, { readOnly: true })
    const rows = db.prepare(
      `SELECT id, model_config_json, created_at, input_tokens, output_tokens
       FROM sessions
       WHERE model_config_json IS NOT NULL AND TRIM(model_config_json) != ''`
    ).all() as unknown as GooseRow[]

    const conversations: ConversationSummary[] = []
    for (const row of rows) {
      const createdAt = parseCreatedAt(String(row.created_at ?? ''))
      if (createdAt < cutoff) continue

      let model = 'unknown'
      try {
        const cfg = JSON.parse(String(row.model_config_json ?? '{}')) as { model_name?: string }
        model = cfg.model_name?.trim() || 'unknown'
      } catch {}

      const input = Number(row.input_tokens ?? 0)
      const output = Number(row.output_tokens ?? 0)
      if (input + output === 0) continue

      conversations.push({
        id: String(row.id ?? ''),
        project: 'goose',
        messageCount: 0,
        tokens: { input, output, cacheRead: 0, cacheWrite: 0, total: input + output },
        model,
        lastActivity: createdAt,
        created: createdAt,
        status: convStatus(createdAt),
      })
    }
    return conversations
  } catch {
    return []
  } finally {
    try { db?.close() } catch {}
  }
}

const GOOSE_PLUGIN: TokenPlugin = {
  id: 'goose',
  name: 'Goose',
  icon: 'Gs',
  description: 'Tracks token usage from Block Goose AI sessions (~/.local/share/goose/sessions)',
  dataPath: LINUX_DB,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(LINUX_DB) || await pathExists(MACOS_DB))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)
    const dbPath = fsSync.existsSync(LINUX_DB) ? LINUX_DB : MACOS_DB
    const conversations = await readGoose(dbPath, cutoff)
    if (conversations.length === 0) return emptyPluginData('goose')
    return buildPluginData('goose', conversations, options)
  },
}

export default GOOSE_PLUGIN
