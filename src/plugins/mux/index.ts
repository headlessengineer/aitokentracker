import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,
  AvailabilityResult,
} from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

const SESSIONS_DIR = path.join(os.homedir(), '.mux', 'sessions')

interface MuxTokenBucket { tokens?: number }
interface MuxModelUsage {
  input?: MuxTokenBucket
  cached?: MuxTokenBucket
  cacheCreate?: MuxTokenBucket
  output?: MuxTokenBucket
}
interface MuxSessionUsage {
  byModel?: Record<string, MuxModelUsage>
  lastRequest?: { model?: string; timestamp?: number }
}

const MUX_PLUGIN: TokenPlugin = {
  id: 'mux',
  name: 'Mux',
  icon: 'Mx',
  description: 'Tracks token usage from Mux AI coding sessions (~/.mux/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(SESSIONS_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    let workspaceDirs: string[]
    try { workspaceDirs = await fs.readdir(SESSIONS_DIR) } catch { return emptyPluginData('mux') }

    const conversations: ConversationSummary[] = []

    for (const wsDir of workspaceDirs) {
      const usageFile = path.join(SESSIONS_DIR, wsDir, 'session-usage.json')
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(usageFile) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(usageFile, 'utf-8') } catch { continue }
      let usage: MuxSessionUsage
      try { usage = JSON.parse(raw) as MuxSessionUsage } catch { continue }

      if (!usage.byModel) continue

      const timestamp = usage.lastRequest?.timestamp ? new Date(usage.lastRequest.timestamp) : stat.mtime
      let totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheWrite = 0
      let model = usage.lastRequest?.model ?? 'unknown'

      for (const [modelName, mu] of Object.entries(usage.byModel)) {
        if (!model || model === 'unknown') model = modelName
        totalInput += mu.input?.tokens ?? 0
        totalOutput += mu.output?.tokens ?? 0
        totalCacheRead += mu.cached?.tokens ?? 0
        totalCacheWrite += mu.cacheCreate?.tokens ?? 0
      }

      if (totalInput + totalOutput === 0) continue

      const total = totalInput + totalOutput + totalCacheRead + totalCacheWrite
      conversations.push({
        id: wsDir,
        project: wsDir,
        messageCount: 0,
        tokens: { input: totalInput, output: totalOutput, cacheRead: totalCacheRead, cacheWrite: totalCacheWrite, total },
        model,
        lastActivity: timestamp,
        created: timestamp,
        status: convStatus(timestamp),
      })
    }

    return buildPluginData('mux', conversations, options)
  },
}

export default MUX_PLUGIN
