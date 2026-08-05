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

const DATA_DIR = path.join(os.homedir(), '.codebuddy', 'projects')

interface CodeBuddyUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
}

interface CodeBuddyProviderData {
  model?: string
  requestModelId?: string
  messageId?: string
  rawUsage?: {
    prompt_tokens?: number
    completion_tokens?: number
    prompt_cache_hit_tokens?: number
  }
}

interface CodeBuddyEntry {
  type?: string
  role?: string
  timestamp?: number | string
  sessionId?: string
  cwd?: string
  providerData?: CodeBuddyProviderData
  message?: { usage?: CodeBuddyUsage }
}

function parseTencentJsonl(raw: string): {
  input: number; output: number; cacheRead: number; cacheWrite: number
  model: string; messageCount: number
} {
  let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, messageCount = 0
  let model = 'codebuddy'

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    let entry: CodeBuddyEntry
    try { entry = JSON.parse(line) as CodeBuddyEntry } catch { continue }

    if (entry.type === 'message' && entry.role === 'assistant') {
      const u = entry.message?.usage
      if (!u) continue
      input += Math.max(0, u.input_tokens ?? 0)
      output += Math.max(0, u.output_tokens ?? 0)
      cacheRead += Math.max(0, u.cache_read_input_tokens ?? 0)
      cacheWrite += Math.max(0, u.cache_creation_input_tokens ?? 0)
      messageCount++
      const m = entry.providerData?.model
      if (m && m !== 'codebuddy') model = m
    } else if (entry.type === 'function_call') {
      const raw = entry.providerData?.rawUsage
      if (!raw) continue
      input += Math.max(0, raw.prompt_tokens ?? 0)
      output += Math.max(0, raw.completion_tokens ?? 0)
      cacheRead += Math.max(0, raw.prompt_cache_hit_tokens ?? 0)
      messageCount++
      const m = entry.providerData?.requestModelId
      if (m && m !== 'codebuddy') model = m
    }
  }

  return { input, output, cacheRead, cacheWrite, model, messageCount }
}

const CODEBUDDY_PLUGIN: TokenPlugin = {
  id: 'codebuddy',
  name: 'CodeBuddy',
  icon: 'Bu',
  description: 'Tracks token usage from CodeBuddy AI sessions (~/.codebuddy/projects)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(DATA_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const files = await globFiles(DATA_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('codebuddy')

    const conversations: ConversationSummary[] = []

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      const { input, output, cacheRead, cacheWrite, model, messageCount } = parseTencentJsonl(raw)
      if (input + output === 0) continue

      const rel = path.relative(DATA_DIR, file)
      const project = rel.split(path.sep)[0] ?? 'Unknown'
      const total = input + output + cacheRead + cacheWrite

      conversations.push({
        id: path.basename(file, '.jsonl'),
        project,
        messageCount,
        tokens: { input, output, cacheRead, cacheWrite, total },
        model,
        lastActivity: stat.mtime,
        created: stat.mtime,
        status: convStatus(stat.mtime),
      })
    }

    if (conversations.length === 0) return emptyPluginData('codebuddy')
    return buildPluginData('codebuddy', conversations, options)
  },
}

export default CODEBUDDY_PLUGIN
