import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus, globFiles } from '../core/collect'

const JCODE_HOME = process.env.JCODE_HOME ?? path.join(os.homedir(), '.jcode')
const SESSIONS_DIR = path.join(JCODE_HOME, 'sessions')

interface JcodeTokenUsage {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number
  cache_creation_input_tokens?: number
  reasoning_output_tokens?: number
}

interface JcodeMessage {
  token_usage?: JcodeTokenUsage
}

interface JcodeSession {
  model?: string
  provider_key?: string
  messages?: JcodeMessage[]
}

const JCODE_PLUGIN: TokenPlugin = {
  id: 'jcode',
  name: 'JCode',
  icon: 'Jc',
  description: 'Tracks token usage from JCode AI coding sessions (~/.jcode/sessions)',
  dataPath: SESSIONS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(SESSIONS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const files = await globFiles(SESSIONS_DIR, '.json')
    const sessionFiles = files.filter((f) => path.basename(f).startsWith('session_'))
    if (sessionFiles.length === 0) return emptyPluginData('jcode')

    const conversations: ConversationSummary[] = []

    for (const file of sessionFiles) {
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }
      let session: JcodeSession
      try { session = JSON.parse(raw) as JcodeSession } catch { continue }

      let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, messageCount = 0

      for (const msg of session.messages ?? []) {
        const u = msg.token_usage
        if (!u) continue
        input += Math.max(0, u.input_tokens ?? 0)
        output += Math.max(0, u.output_tokens ?? 0)
        cacheRead += Math.max(0, u.cache_read_input_tokens ?? 0)
        cacheWrite += Math.max(0, u.cache_creation_input_tokens ?? 0)
        messageCount++
      }

      if (input + output === 0 && messageCount === 0) continue

      const total = input + output + cacheRead + cacheWrite
      conversations.push({
        id: path.basename(file, '.json'),
        project: path.basename(JCODE_HOME),
        messageCount,
        tokens: { input, output, cacheRead, cacheWrite, total },
        model: session.model ?? 'unknown',
        lastActivity: stat.mtime,
        created: stat.mtime,
        status: convStatus(stat.mtime),
      })
    }

    if (conversations.length === 0) return emptyPluginData('jcode')
    return buildPluginData('jcode', conversations, options)
  },
}

export default JCODE_PLUGIN
