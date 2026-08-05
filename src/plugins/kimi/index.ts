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

const SESSIONS_DIR = path.join(os.homedir(), '.kimi', 'sessions')

interface KimiTokenUsage {
  input_other?: number
  inputOther?: number
  output?: number
  input_cache_read?: number
  inputCacheRead?: number
  input_cache_creation?: number
  inputCacheCreation?: number
}

interface KimiStatus {
  token_usage?: KimiTokenUsage
}

interface KimiEntry {
  type?: string
  kind?: string
  payload?: KimiStatus
  message?: { status?: KimiStatus }
  model?: string
  sessionId?: string
}

const KIMI_PLUGIN: TokenPlugin = {
  id: 'kimi',
  name: 'Kimi',
  icon: 'Km',
  description: 'Tracks token usage from Kimi CLI sessions (~/.kimi/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(SESSIONS_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const files = await globFiles(SESSIONS_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('kimi')

    const sessionMap = new Map<string, ConversationSummary>()

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      // Group ID → Session ID from path: sessions/<GROUP_ID>/<SESSION_UUID>/wire.jsonl
      const parts = path.relative(SESSIONS_DIR, file).split(path.sep)
      const sessionId = parts.length >= 2 ? parts[parts.length - 2] : path.basename(file, '.jsonl')
      const project = parts.length >= 3 ? parts[0] : 'Unknown'
      let model = 'kimi-moonshot'
      let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, messageCount = 0

      for (const line of raw.split('\n')) {
        if (!line.trim()) continue
        let entry: KimiEntry
        try { entry = JSON.parse(line) as KimiEntry } catch { continue }

        // usage.record lines or status lines contain token_usage
        const usage =
          entry.payload?.token_usage ??
          entry.message?.status?.token_usage

        if (!usage) continue

        const inp = Math.max(0, usage.input_other ?? usage.inputOther ?? 0)
        const out = Math.max(0, usage.output ?? 0)
        if (inp + out === 0) continue

        input += inp
        output += out
        cacheRead += Math.max(0, usage.input_cache_read ?? usage.inputCacheRead ?? 0)
        cacheWrite += Math.max(0, usage.input_cache_creation ?? usage.inputCacheCreation ?? 0)
        messageCount++
        if (entry.model && !model) model = entry.model
      }

      if (input + output === 0 && messageCount === 0) continue

      const total = input + output + cacheRead + cacheWrite
      const existing = sessionMap.get(sessionId)
      if (!existing) {
        sessionMap.set(sessionId, {
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
    }

    const conversations = [...sessionMap.values()]
    if (conversations.length === 0) return emptyPluginData('kimi')
    return buildPluginData('kimi', conversations, options)
  },
}

export default KIMI_PLUGIN
