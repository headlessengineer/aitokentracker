import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,
  AvailabilityResult,
} from '../core/types'
import { emptyPluginData, buildPluginData, globFiles, pathExists, convStatus,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

const PROJECTS_DIR = path.join(os.homedir(), '.qwen', 'projects')

interface QwenLine {
  type?: string
  model?: string
  timestamp?: string
  sessionId?: string
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    cachedContentTokenCount?: number
  }
}

const QWEN_PLUGIN: TokenPlugin = {
  id: 'qwen',
  name: 'Qwen CLI',
  icon: 'Qw',
  description: 'Tracks token usage from Qwen CLI AI coding sessions (~/.qwen/projects)',
  dataPath: PROJECTS_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(PROJECTS_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const files = await globFiles(PROJECTS_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('qwen')

    const sessionMap = new Map<string, ConversationSummary & { lastTs: number }>()

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      // project = the direct child of PROJECTS_DIR containing this file
      const rel = path.relative(PROJECTS_DIR, file)
      const project = rel.split(path.sep)[0] ?? 'Unknown'

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        let obj: QwenLine
        try { obj = JSON.parse(line) as QwenLine } catch { continue }
        if (obj.type !== 'response' || !obj.usageMetadata) continue

        const sessionId = obj.sessionId ?? path.basename(file, '.jsonl')
        const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : stat.mtime.getTime()
        const lastActivity = new Date(ts)
        if (lastActivity < cutoff) continue

        const input = obj.usageMetadata.promptTokenCount ?? 0
        const output = obj.usageMetadata.candidatesTokenCount ?? 0
        const cacheRead = obj.usageMetadata.cachedContentTokenCount ?? 0
        const total = input + output + cacheRead

        const existing = sessionMap.get(sessionId)
        if (existing) {
          existing.tokens.input += input
          existing.tokens.output += output
          existing.tokens.cacheRead += cacheRead
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
            tokens: { input, output, cacheRead, cacheWrite: 0, total },
            model: obj.model ?? 'qwen-plus',
            lastActivity,
            created: lastActivity,
            status: convStatus(lastActivity),
            lastTs: ts,
          })
        }
      }
    }

    const conversations = [...sessionMap.values()].map(({ lastTs: _lt, ...c }) => c)
    return buildPluginData('qwen', conversations, options)
  },
}

export default QWEN_PLUGIN
