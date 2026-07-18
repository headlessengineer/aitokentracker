import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const SESSIONS_DIR = path.join(os.homedir(), '.junie', 'sessions')

interface JunieLlmUsage {
  model?: string
  inputTokens?: number
  cacheInputTokens?: number
  cacheCreateTokens?: number
  outputTokens?: number
  reasoningTokens?: number
}

interface JunieAgentEvent {
  kind?: string
  modelUsage?: JunieLlmUsage[]
}

interface JunieEvent {
  kind?: string
  timestampMs?: number
  event?: {
    agentEvent?: JunieAgentEvent
  }
}

const JUNIE_PLUGIN: TokenPlugin = {
  id: 'junie',
  name: 'Junie',
  icon: 'Ju',
  description: 'Tracks token usage from JetBrains Junie AI sessions (~/.junie/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(SESSIONS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    let sessionDirs: string[]
    try { sessionDirs = await fs.readdir(SESSIONS_DIR) } catch { return emptyPluginData('junie') }

    const conversations: ConversationSummary[] = []

    for (const sessionId of sessionDirs) {
      const eventsFile = path.join(SESSIONS_DIR, sessionId, 'events.jsonl')

      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(eventsFile) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(eventsFile, 'utf-8') } catch { continue }

      let input = 0, output = 0, cacheRead = 0, cacheWrite = 0
      let model = ''
      let lastTs = stat.mtime.getTime()

      for (const line of raw.split('\n')) {
        if (!line.trim() || !line.includes('LlmResponseMetadataEvent')) continue
        let obj: JunieEvent
        try { obj = JSON.parse(line) as JunieEvent } catch { continue }
        if (obj.kind !== 'SessionA2uxEvent') continue

        const agentEvent = obj.event?.agentEvent
        if (agentEvent?.kind !== 'LlmResponseMetadataEvent' || !agentEvent.modelUsage) continue

        if (obj.timestampMs && obj.timestampMs > lastTs) lastTs = obj.timestampMs

        for (const usage of agentEvent.modelUsage) {
          input += usage.inputTokens ?? 0
          output += usage.outputTokens ?? 0
          cacheRead += usage.cacheInputTokens ?? 0
          cacheWrite += usage.cacheCreateTokens ?? 0
          if (usage.model && !model) model = usage.model
        }
      }

      if (input + output === 0) continue

      const lastActivity = new Date(lastTs)
      const total = input + output + cacheRead + cacheWrite

      conversations.push({
        id: sessionId,
        project: 'junie',
        messageCount: 1,
        tokens: { input, output, cacheRead, cacheWrite, total },
        model: model || 'unknown',
        lastActivity,
        created: stat.mtime,
        status: convStatus(lastActivity),
      })
    }

    return buildPluginData('junie', conversations, options)
  },
}

export default JUNIE_PLUGIN
