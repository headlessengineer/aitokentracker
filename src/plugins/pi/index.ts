import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles } from '../core/collect'

const SESSIONS_DIR = path.join(os.homedir(), '.pi', 'agent', 'sessions')

interface PiUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

interface PiMessage {
  usage?: PiUsage
  model?: string
  provider?: string
}

interface PiEntry {
  type?: string
  cwd?: string
  session?: { id?: string; cwd?: string }
  message?: PiMessage
  timestamp?: number | string
}

const PI_PLUGIN: TokenPlugin = {
  id: 'pi',
  name: 'Pi',
  icon: 'Pi',
  description: 'Tracks token usage from Pi agent sessions (~/.pi/agent/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(SESSIONS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const files = await globFiles(SESSIONS_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('pi')

    const conversations: ConversationSummary[] = []

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      let sessionId = path.basename(file, '.jsonl')
      let project = path.basename(path.dirname(file))
      let model = 'unknown'
      let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, messageCount = 0

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        let entry: PiEntry
        try { entry = JSON.parse(line) as PiEntry } catch { continue }

        if (entry.type === 'session' && entry.session?.cwd) {
          project = path.basename(entry.session.cwd)
          if (entry.session.id) sessionId = entry.session.id
        }

        const usage = entry.message?.usage
        if (!usage) continue

        const inp = Math.max(0, usage.input_tokens ?? 0)
        const out = Math.max(0, usage.output_tokens ?? 0)
        if (inp + out === 0) continue

        input += inp
        output += out
        cacheRead += Math.max(0, usage.cache_read_input_tokens ?? 0)
        cacheWrite += Math.max(0, usage.cache_creation_input_tokens ?? 0)
        messageCount++
        if (entry.message?.model && !model) model = entry.message.model
      }

      if (input + output === 0 && messageCount === 0) continue

      const total = input + output + cacheRead + cacheWrite
      conversations.push({
        id: sessionId,
        project,
        messageCount,
        tokens: { input, output, cacheRead, cacheWrite, total },
        model,
        lastActivity: stat.mtime,
        created: stat.mtime,
        status: convStatus(stat.mtime),
      })
    }

    if (conversations.length === 0) return emptyPluginData('pi')
    return buildPluginData('pi', conversations, options)
  },
}

export default PI_PLUGIN
