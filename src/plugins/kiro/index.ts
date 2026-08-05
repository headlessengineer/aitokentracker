import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,
  AvailabilityResult,
} from '../core/types'
import {
  emptyPluginData,
  buildPluginData,
  pathExists,
  convStatus,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

const DATA_DIR = path.join(os.homedir(), '.kiro', 'sessions', 'cli')

interface KiroTurnMeta {
  input_token_count?: number
  output_token_count?: number
  metering_usage?: Array<{ value: number; unit: string }>
  builtin_tool_uses?: number
  end_timestamp?: number
  context_usage_percentage?: number
}

interface KiroConvMeta {
  user_turn_metadatas?: KiroTurnMeta[]
}

interface KiroSessionState {
  conversation_metadata?: KiroConvMeta
}

interface KiroSession {
  session_id?: string
  cwd?: string
  created_at?: string
  updated_at?: string
  title?: string
  session_state?: KiroSessionState
}

const KIRO_PLUGIN: TokenPlugin = {
  id: 'kiro',
  name: 'Kiro',
  icon: 'Ki',
  description: 'Tracks token usage from Amazon Kiro AI coding sessions (~/.kiro/sessions/cli)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(DATA_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    let entries: string[]
    try {
      entries = await fs.readdir(DATA_DIR)
    } catch {
      return emptyPluginData('kiro')
    }

    const jsonFiles = entries.filter((e) => e.endsWith('.json'))
    const conversations: ConversationSummary[] = []

    for (const entry of jsonFiles) {
      const file = path.join(DATA_DIR, entry)
      let raw: string
      try {
        raw = await fs.readFile(file, 'utf-8')
      } catch {
        continue
      }

      let session: KiroSession
      try {
        session = JSON.parse(raw) as KiroSession
      } catch {
        continue
      }

      const updated = session.updated_at ? new Date(session.updated_at) : null
      const created = session.created_at ? new Date(session.created_at) : null
      if (!updated || updated < cutoff) continue

      const turns = session.session_state?.conversation_metadata?.user_turn_metadatas ?? []

      let inputTokens = 0
      let outputTokens = 0
      let toolCalls = 0

      for (const t of turns) {
        inputTokens += t.input_token_count ?? 0
        outputTokens += t.output_token_count ?? 0
        toolCalls += t.builtin_tool_uses ?? 0
      }

      // Fallback: if token counts are 0, estimate from context usage
      if (inputTokens === 0 && turns.length > 0) {
        const KIRO_CONTEXT_WINDOW = 200_000
        const avgCtx = turns.reduce((s, t) => s + (t.context_usage_percentage ?? 0), 0) / turns.length
        inputTokens = Math.round((avgCtx / 100) * KIRO_CONTEXT_WINDOW * turns.length * 0.5)
        outputTokens = Math.round(inputTokens * 0.1)
      }

      const project = session.cwd ? path.basename(session.cwd) : 'Unknown'
      const sessionId = session.session_id ?? path.basename(entry, '.json')
      const total = inputTokens + outputTokens

      conversations.push({
        id: sessionId,
        project,
        messageCount: turns.length,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          cacheRead: 0,
          cacheWrite: 0,
          total,
        },
        model: 'claude-sonnet',
        lastActivity: updated,
        created: created ?? updated,
        status: convStatus(updated),
      })
    }

    return buildPluginData('kiro', conversations, options)
  },
}

export default KIRO_PLUGIN
