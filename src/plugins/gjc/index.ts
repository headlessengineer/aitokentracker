import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles } from '../core/collect'

const GJC_DIR = process.env.GJC_CODING_AGENT_DIR ?? path.join(os.homedir(), '.gjc', 'agent')
const SESSIONS_DIR = path.join(GJC_DIR, 'sessions')

interface GjcUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  cost?: { total?: number }
}

interface GjcEntry {
  type?: string
  id?: string
  cwd?: string
  timestamp?: number | string
  model?: string
  provider?: string
  usage?: GjcUsage
  sessionId?: string
}

const GJC_PLUGIN: TokenPlugin = {
  id: 'gjc',
  name: 'GJC',
  icon: 'Gj',
  description: 'Tracks token usage from gajae-code (gjc) sessions (~/.gjc/agent/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(SESSIONS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const files = await globFiles(SESSIONS_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('gjc')

    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      let sessionId = path.basename(file, '.jsonl')
      let project = path.basename(path.dirname(file))
      let model = 'unknown'

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        let entry: GjcEntry
        try { entry = JSON.parse(line) as GjcEntry } catch { continue }

        // Session header
        if (entry.type === 'session' && entry.id) {
          sessionId = entry.id
          if (entry.cwd) project = path.basename(entry.cwd)
          continue
        }

        const usage = entry.usage
        if (!usage) continue

        const ts = entry.timestamp
          ? (typeof entry.timestamp === 'number' ? entry.timestamp : new Date(entry.timestamp).getTime())
          : stat.mtime.getTime()
        const lastActivity = new Date(ts)
        if (lastActivity < cutoff) continue

        const input = Math.max(0, usage.input_tokens ?? 0)
        const output = Math.max(0, usage.output_tokens ?? 0)
        if (input + output === 0) continue

        const cacheRead = Math.max(0, usage.cache_read_input_tokens ?? 0)
        const cacheWrite = Math.max(0, usage.cache_creation_input_tokens ?? 0)
        const total = input + output + cacheRead + cacheWrite
        if (entry.model) model = entry.model

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
    if (conversations.length === 0) return emptyPluginData('gjc')
    return buildPluginData('gjc', conversations, options)
  },
}

export default GJC_PLUGIN
