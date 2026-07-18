import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, globFiles, pathExists, convStatus, parseClaudeStyleJsonl } from '../core/collect'

const DATA_DIR = path.join(os.homedir(), '.opencodereview', 'sessions')

const OPENCODEREVIEW_PLUGIN: TokenPlugin = {
  id: 'opencodereview',
  name: 'OpenCode Review',
  icon: 'Rv',
  description: 'Tracks token usage from OpenCode Review sessions (~/.opencodereview/sessions)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(DATA_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const files = await globFiles(DATA_DIR, '.jsonl')
    if (files.length === 0) return emptyPluginData('opencodereview')

    const conversations: ConversationSummary[] = []

    for (const file of files) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }

      const { inputTokens, outputTokens, cacheRead, cacheWrite, model, messageCount } = parseClaudeStyleJsonl(raw)
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

    return buildPluginData('opencodereview', conversations, options)
  },
}

export default OPENCODEREVIEW_PLUGIN
