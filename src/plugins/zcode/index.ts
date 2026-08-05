import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary,   AvailabilityResult,
} from '../core/types'
import { emptyPluginData, buildPluginData, globFiles, pathExists, convStatus, parseClaudeStyleJsonl,   availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

const DATA_DIR = path.join(os.homedir(), '.zcode', 'projects')

const ZCODE_PLUGIN: TokenPlugin = {
  id: 'zcode',
  name: 'ZCode',
  icon: 'Zc',
  description: 'Tracks token usage from ZCode AI coding sessions (~/.zcode/projects)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(DATA_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const files = await globFiles(DATA_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('zcode')

    const conversations: ConversationSummary[] = []
    const seen = new Set<string>()

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      const { inputTokens, outputTokens, cacheRead, cacheWrite, model, messageCount } = parseClaudeStyleJsonl(raw, seen)
      if (inputTokens + outputTokens === 0) continue

      const rel = path.relative(DATA_DIR, file)
      const project = rel.split(path.sep)[0] ?? 'Unknown'
      const total = inputTokens + outputTokens + cacheRead + cacheWrite

      conversations.push({
        id: path.basename(file, '.jsonl'),
        project,
        messageCount,
        tokens: { input: inputTokens, output: outputTokens, cacheRead, cacheWrite, total },
        model: model || 'unknown',
        lastActivity: stat.mtime,
        created: stat.mtime,
        status: convStatus(stat.mtime),
      })
    }

    return buildPluginData('zcode', conversations, options)
  },
}

export default ZCODE_PLUGIN
