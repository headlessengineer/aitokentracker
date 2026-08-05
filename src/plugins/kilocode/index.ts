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

const TASKS_DIR = path.join(
  os.homedir(),
  '.config',
  'Code',
  'User',
  'globalStorage',
  'kilocode.kilo-code',
  'tasks',
)

interface ApiReqPayload {
  tokensIn?: number
  tokensOut?: number
  cacheReads?: number
  cacheWrites?: number
}
interface UiMessage {
  type?: string
  say?: string
  text?: string
}

async function parseTaskDir(taskDir: string, cutoff: Date): Promise<ConversationSummary | null> {
  const msgFile = path.join(taskDir, 'ui_messages.json')
  let stat: Awaited<ReturnType<typeof fs.stat>>
  try { stat = await fs.stat(msgFile) } catch { return null }
  if (stat.mtime < cutoff) return null

  let raw: string
  try { raw = await fs.readFile(msgFile, 'utf-8') } catch { return null }
  let entries: UiMessage[]
  try { entries = JSON.parse(raw) as UiMessage[] } catch { return null }

  let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheWrite = 0, messageCount = 0
  for (const entry of entries) {
    if (entry.type !== 'say' || entry.say !== 'api_req_started' || !entry.text) continue
    let payload: ApiReqPayload
    try { payload = JSON.parse(entry.text) as ApiReqPayload } catch { continue }
    inputTokens += payload.tokensIn ?? 0
    outputTokens += payload.tokensOut ?? 0
    cacheRead += payload.cacheReads ?? 0
    cacheWrite += payload.cacheWrites ?? 0
    messageCount++
  }
  if (inputTokens + outputTokens === 0 && messageCount === 0) return null

  const total = inputTokens + outputTokens + cacheRead + cacheWrite
  return {
    id: path.basename(taskDir),
    project: 'kilo-code',
    messageCount,
    tokens: { input: inputTokens, output: outputTokens, cacheRead, cacheWrite, total },
    model: 'claude-sonnet',
    lastActivity: stat.mtime,
    created: stat.mtime,
    status: convStatus(stat.mtime),
  }
}

const KILOCODE_PLUGIN: TokenPlugin = {
  id: 'kilocode',
  name: 'Kilo Code',
  icon: 'Kc',
  description: 'Tracks token usage from Kilo Code VS Code extension tasks',
  dataPath: TASKS_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    return availResult(await pathExists(TASKS_DIR))
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)
    let taskDirs: string[]
    try { taskDirs = await fs.readdir(TASKS_DIR) } catch { return emptyPluginData('kilocode') }
    const conversations: ConversationSummary[] = []
    for (const d of taskDirs) {
      const result = await parseTaskDir(path.join(TASKS_DIR, d), cutoff)
      if (result) conversations.push(result)
    }
    return buildPluginData('kilocode', conversations, options)
  },
}

export default KILOCODE_PLUGIN
