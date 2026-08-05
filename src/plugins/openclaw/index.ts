import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,
  AvailabilityResult,
} from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

const AGENTS_DIR = path.join(os.homedir(), '.openclaw', 'agents')

interface OpenClawUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

interface OpenClawMessage {
  usage?: OpenClawUsage
  provider?: string
  model?: string
}

interface OpenClawEntry {
  modelId?: string
  provider?: string
  message?: OpenClawMessage
  sessionId?: string
  timestamp?: number | string
}

const OPENCLAW_PLUGIN: TokenPlugin = {
  id: 'openclaw',
  name: 'OpenClaw',
  icon: 'Ow',
  description: 'Tracks token usage from OpenClaw AI coding sessions (~/.openclaw/agents)',
  dataPath: AGENTS_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(AGENTS_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const files = await globFiles(AGENTS_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('openclaw')

    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      const project = path.basename(path.dirname(file))

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        let entry: OpenClawEntry
        try { entry = JSON.parse(line) as OpenClawEntry } catch { continue }

        const usage = entry.message?.usage
        if (!usage) continue

        const input = Math.max(0, usage.input_tokens ?? 0)
        const output = Math.max(0, usage.output_tokens ?? 0)
        const cacheRead = Math.max(0, usage.cache_read_input_tokens ?? 0)
        const cacheWrite = Math.max(0, usage.cache_creation_input_tokens ?? 0)
        if (input + output === 0) continue

        const ts = entry.timestamp
          ? (typeof entry.timestamp === 'number' ? entry.timestamp : new Date(entry.timestamp).getTime())
          : stat.mtime.getTime()
        const lastActivity = new Date(ts)
        const sessionId = entry.sessionId ?? path.basename(file, '.jsonl')
        const model = entry.modelId ?? entry.message?.model ?? 'unknown'
        const total = input + output + cacheRead + cacheWrite

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
            model,
            lastActivity,
            created: lastActivity,
            status: convStatus(lastActivity),
            lastTs: ts,
          })
        }
      }
    }

    const conversations = [...sessionMap.values()].map(({ lastTs: _lt, ...c }) => c)
    if (conversations.length === 0) return emptyPluginData('openclaw')
    return buildPluginData('openclaw', conversations, options)
  },
}

export default OPENCLAW_PLUGIN
