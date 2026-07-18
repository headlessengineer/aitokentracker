import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles } from '../core/collect'

const CODEX_HOME = process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex')
const SESSIONS_DIR = path.join(CODEX_HOME, 'sessions')
const ARCHIVED_DIR = path.join(CODEX_HOME, 'archived_sessions')

interface CodexTokenUsage {
  input_tokens?: number
  output_tokens?: number
  cached_input_tokens?: number
  cache_read_input_tokens?: number
  reasoning_output_tokens?: number
}

interface CodexTotals {
  input: number
  output: number
  cached: number
  reasoning: number
}

function usageToTotals(u: CodexTokenUsage): CodexTotals {
  return {
    input: Math.max(0, u.input_tokens ?? 0),
    output: Math.max(0, u.output_tokens ?? 0),
    cached: Math.max(0, u.cached_input_tokens ?? u.cache_read_input_tokens ?? 0),
    reasoning: Math.max(0, u.reasoning_output_tokens ?? 0),
  }
}

function deltaTotals(curr: CodexTotals, prev: CodexTotals): CodexTotals | null {
  if (curr.input < prev.input || curr.output < prev.output) return null
  return {
    input: curr.input - prev.input,
    output: curr.output - prev.output,
    cached: Math.max(0, curr.cached - prev.cached),
    reasoning: Math.max(0, curr.reasoning - prev.reasoning),
  }
}

interface SessionAccum {
  id: string
  cwd: string
  model: string
  prevTotals: CodexTotals
  input: number
  output: number
  cached: number
  messageCount: number
  timestamp: Date
}

function parseCodexJsonl(raw: string, fileMtime: Date): SessionAccum[] {
  const sessions = new Map<string, SessionAccum>()
  let currentSessionId = ''

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let obj: Record<string, unknown>
    try {
      obj = JSON.parse(trimmed) as Record<string, unknown>
    } catch {
      continue
    }

    const entryType = obj.type as string | undefined
    const payload = obj.payload as Record<string, unknown> | undefined

    // Headless format: {usage: {input_tokens, output_tokens, ...}}
    if (!entryType && obj.usage) {
      const u = obj.usage as CodexTokenUsage
      const session = sessions.get(currentSessionId)
      if (session) {
        session.input += Math.max(0, u.input_tokens ?? 0)
        session.output += Math.max(0, u.output_tokens ?? 0)
        session.cached += Math.max(0, u.cached_input_tokens ?? u.cache_read_input_tokens ?? 0)
        session.messageCount++
      }
      continue
    }

    if (entryType === 'session_meta' && payload) {
      const id = (payload.id as string | undefined) ?? path.basename(trimmed).slice(0, 8)
      if (!id) continue
      currentSessionId = id
      if (!sessions.has(id)) {
        sessions.set(id, {
          id,
          cwd: (payload.cwd as string | undefined) ?? '',
          model: '',
          prevTotals: { input: 0, output: 0, cached: 0, reasoning: 0 },
          input: 0,
          output: 0,
          cached: 0,
          messageCount: 0,
          timestamp: fileMtime,
        })
      }
      continue
    }

    if (entryType === 'turn_context' && payload) {
      const model =
        (payload.model as string | undefined) ??
        ((payload.model_info as Record<string, unknown> | undefined)?.slug as string | undefined) ??
        ''
      const session = sessions.get(currentSessionId)
      if (session && model && !session.model) {
        session.model = model
      }
      continue
    }

    if (entryType === 'event_msg' && payload) {
      const payloadType = payload.payload_type as string | undefined
      if (payloadType === 'token_count') {
        const info = payload.info as Record<string, unknown> | undefined
        const lastUsage = info?.last_token_usage as CodexTokenUsage | undefined
        if (lastUsage) {
          const curr = usageToTotals(lastUsage)
          const session = sessions.get(currentSessionId)
          if (session) {
            const delta = deltaTotals(curr, session.prevTotals)
            if (delta) {
              session.input += delta.input
              session.output += delta.output
              session.cached += delta.cached
              session.messageCount++
            } else {
              // Reset or stale event — treat last_token_usage as absolute for this turn
              session.input += curr.input
              session.output += curr.output
              session.cached += curr.cached
              session.messageCount++
            }
            session.prevTotals = curr
          }
        }
        continue
      }
    }
  }

  return [...sessions.values()]
}

async function collectFromDir(dir: string, cutoff: Date): Promise<ConversationSummary[]> {
  let files: string[]
  try {
    files = await globFiles(dir, '.jsonl')
  } catch {
    return []
  }

  const conversations: ConversationSummary[] = []

  for (const file of files) {
    let stat: Awaited<ReturnType<typeof fs.stat>>
    try {
      stat = await fs.stat(file)
    } catch {
      continue
    }
    if (stat.mtime < cutoff) continue

    let raw: string
    try {
      raw = await fs.readFile(file, 'utf-8')
    } catch {
      continue
    }

    const sessions = parseCodexJsonl(raw, stat.mtime)

    for (const s of sessions) {
      if (s.input + s.output === 0 && s.messageCount === 0) continue
      const project = s.cwd ? path.basename(s.cwd) : path.basename(path.dirname(file))
      const total = s.input + s.output + s.cached
      conversations.push({
        id: s.id || path.basename(file, '.jsonl'),
        project,
        messageCount: s.messageCount,
        tokens: {
          input: s.input,
          output: s.output,
          cacheRead: s.cached,
          cacheWrite: 0,
          total,
        },
        model: s.model || 'gpt-4o',
        lastActivity: s.timestamp,
        created: s.timestamp,
        status: convStatus(s.timestamp),
      })
    }
  }

  return conversations
}

const CODEX_PLUGIN: TokenPlugin = {
  id: 'codex',
  name: 'OpenAI Codex',
  icon: 'Cx',
  description: 'Tracks token usage from OpenAI Codex CLI sessions (~/.codex/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(SESSIONS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const [active, archived] = await Promise.all([
      collectFromDir(SESSIONS_DIR, cutoff),
      collectFromDir(ARCHIVED_DIR, cutoff),
    ])

    // Deduplicate by session ID (same session can appear in both dirs)
    const seenIds = new Set<string>()
    const conversations: ConversationSummary[] = []
    for (const c of [...active, ...archived]) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id)
        conversations.push(c)
      }
    }

    if (conversations.length === 0) return emptyPluginData('codex')
    return buildPluginData('codex', conversations, options)
  },
}

export default CODEX_PLUGIN
