import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const TASKS_DIR = path.join(
  os.homedir(),
  '.config',
  'Code',
  'User',
  'globalStorage',
  'saoudrizwan.claude-dev',
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
  ts?: number
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
    project: 'claude-dev',
    messageCount,
    tokens: { input: inputTokens, output: outputTokens, cacheRead, cacheWrite, total },
    model: 'claude-sonnet',
    lastActivity: stat.mtime,
    created: stat.mtime,
    status: convStatus(stat.mtime),
  }
}

const CLINE_PLUGIN: TokenPlugin = {
  id: 'cline',
  name: 'Cline',
  icon: 'Cl',
  description: 'Tracks token usage from Cline (claude-dev) VS Code extension tasks',
  dataPath: TASKS_DIR,

  async isAvailable(): Promise<boolean> {
    return pathExists(TASKS_DIR)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)
    let taskDirs: string[]
    try { taskDirs = await fs.readdir(TASKS_DIR) } catch { return emptyPluginData('cline') }
    const conversations: ConversationSummary[] = []
    for (const d of taskDirs) {
      const result = await parseTaskDir(path.join(TASKS_DIR, d), cutoff)
      if (result) conversations.push(result)
    }
    return buildPluginData('cline', conversations, options)
  },
}

export default CLINE_PLUGIN
