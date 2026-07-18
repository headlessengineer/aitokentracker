import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const XDG_DATA = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
const DATA_DIR = path.join(XDG_DATA, 'amp', 'threads')

interface AmpTokens {
  input?: number
  output?: number
  cacheReadInputTokens?: number
  cacheCreationInputTokens?: number
}
interface AmpLedgerEvent {
  timestamp?: string
  model?: string
  tokens?: AmpTokens
}
interface AmpMessage {
  role?: string
  messageId?: number
  usage?: {
    model?: string
    inputTokens?: number
    outputTokens?: number
    cacheReadInputTokens?: number
    cacheCreationInputTokens?: number
  }
}
interface AmpThread {
  id?: string
  created?: number
  messages?: AmpMessage[]
  usageLedger?: { events?: AmpLedgerEvent[] }
}

function parseTs(s?: string): number {
  if (!s) return 0
  try { return new Date(s).getTime() } catch { return 0 }
}

const AMP_PLUGIN: TokenPlugin = {
  id: 'amp',
  name: 'Amp',
  icon: 'Ap',
  description: 'Tracks token usage from Sourcegraph Amp AI coding sessions (~/.local/share/amp/threads)',
  dataPath: DATA_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(DATA_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    let entries: string[]
    try { entries = await fs.readdir(DATA_DIR) } catch { return emptyPluginData('amp') }

    const conversations: ConversationSummary[] = []

    for (const entry of entries.filter((e) => e.startsWith('T-') && e.endsWith('.json'))) {
      const file = path.join(DATA_DIR, entry)
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try { stat = await fs.stat(file) } catch { continue }
      if (stat.mtime < cutoff) continue

      let raw: string
      try { raw = await fs.readFile(file, 'utf-8') } catch { continue }
      let thread: AmpThread
      try { thread = JSON.parse(raw) as AmpThread } catch { continue }

      const threadId = thread.id ?? path.basename(entry, '.json')
      const created = thread.created ? new Date(thread.created) : stat.mtime

      let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheWrite = 0
      let model = 'claude-sonnet'
      let messageCount = 0

      const events = thread.usageLedger?.events ?? []
      if (events.length > 0) {
        for (const ev of events) {
          if (ev.model && !model) model = ev.model
          else if (ev.model) model = ev.model
          inputTokens += ev.tokens?.input ?? 0
          outputTokens += ev.tokens?.output ?? 0
          cacheRead += ev.tokens?.cacheReadInputTokens ?? 0
          cacheWrite += ev.tokens?.cacheCreationInputTokens ?? 0
          messageCount++
        }
      } else {
        for (const msg of thread.messages ?? []) {
          if (msg.role !== 'assistant' || !msg.usage) continue
          if (msg.usage.model) model = msg.usage.model
          inputTokens += msg.usage.inputTokens ?? 0
          outputTokens += msg.usage.outputTokens ?? 0
          cacheRead += msg.usage.cacheReadInputTokens ?? 0
          cacheWrite += msg.usage.cacheCreationInputTokens ?? 0
          messageCount++
        }
      }

      if (inputTokens + outputTokens === 0 && messageCount === 0) continue

      const total = inputTokens + outputTokens + cacheRead + cacheWrite
      conversations.push({
        id: threadId,
        project: path.basename(DATA_DIR),
        messageCount,
        tokens: { input: inputTokens, output: outputTokens, cacheRead, cacheWrite, total },
        model,
        lastActivity: stat.mtime,
        created,
        status: convStatus(stat.mtime),
      })
    }

    return buildPluginData('amp', conversations, options)
  },
}

export default AMP_PLUGIN
