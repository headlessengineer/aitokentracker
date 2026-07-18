import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles } from '../core/collect'

const SESSIONS_DIR = path.join(os.homedir(), '.factory', 'sessions')

interface DroidTokenUsage {
  inputTokens?: number
  outputTokens?: number
  cache_creation_tokens?: number
  cache_read_tokens?: number
  thinking_tokens?: number
}

interface DroidSettings {
  model?: string
  providerLock?: string
  tokenUsage?: DroidTokenUsage
}

const DROID_PLUGIN: TokenPlugin = {
  id: 'droid',
  name: 'Droid',
  icon: 'Dr',
  description: 'Tracks token usage from Factory.ai Droid sessions (~/.factory/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(SESSIONS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const files = await globFiles(SESSIONS_DIR, '.json')
    const settingsFiles = files.filter((f) => f.endsWith('.settings.json'))
    if (settingsFiles.length === 0) return emptyPluginData('droid')

    const conversations: ConversationSummary[] = []

    for (const file of settingsFiles) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }
      let settings: DroidSettings
      try { settings = JSON.parse(raw) as DroidSettings } catch { continue }

      const usage = settings.tokenUsage
      if (!usage) continue

      const input = Math.max(0, usage.inputTokens ?? 0)
      const output = Math.max(0, usage.outputTokens ?? 0)
      const cacheWrite = Math.max(0, usage.cache_creation_tokens ?? 0)
      const cacheRead = Math.max(0, usage.cache_read_tokens ?? 0)

      if (input + output === 0) continue

      const total = input + output + cacheRead + cacheWrite
      const sessionId = path.basename(path.dirname(file))
      const project = path.basename(path.dirname(path.dirname(file)))

      conversations.push({
        id: sessionId,
        project,
        messageCount: 0,
        tokens: { input, output, cacheRead, cacheWrite, total },
        model: settings.model ?? 'unknown',
        lastActivity: stat.mtime,
        created: stat.mtime,
        status: convStatus(stat.mtime),
      })
    }

    if (conversations.length === 0) return emptyPluginData('droid')
    return buildPluginData('droid', conversations, options)
  },
}

export default DROID_PLUGIN
