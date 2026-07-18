import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs/promises'
import type { TokenPlugin, PluginData, CollectOptions, ConversationSummary } from '../core/types'
import { emptyPluginData, buildPluginData, pathExists, convStatus } from '../core/collect'

const CODEBUFF_BASE = process.env.CODEBUFF_DATA_DIR ?? path.join(os.homedir(), '.config', 'manicode')

interface AnthropicUsage {
  inputTokens?: number
  outputTokens?: number
  cacheCreationInputTokens?: number
  cacheReadInputTokens?: number
}

interface OpenAIUsage {
  prompt_tokens?: number
  completion_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number }
}

interface CodebuffInnerUsage {
  usage?: AnthropicUsage
  model?: string
}

interface CodebuffMessage {
  variant?: string
  timestamp?: string
  metadata?: {
    model?: string
    usage?: AnthropicUsage
    codebuff?: CodebuffInnerUsage & { usage?: OpenAIUsage }
  }
}

async function parseChatFile(
  chatFile: string,
  project: string,
  cutoff: Date,
): Promise<ConversationSummary | null> {
  let stat: Awaited<ReturnType<typeof fs.stat>>
  try { stat = await fs.stat(chatFile) } catch { return null }
  if (stat.mtime < cutoff) return null

  let raw: string
  try { raw = await fs.readFile(chatFile, 'utf-8') } catch { return null }

  let messages: CodebuffMessage[]
  try { messages = JSON.parse(raw) as CodebuffMessage[] } catch { return null }
  if (!Array.isArray(messages)) return null

  let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, msgCount = 0
  let model = ''
  let lastTs = stat.mtime.getTime()

  for (const msg of messages) {
    if (msg.variant !== 'ai' && msg.variant !== 'assistant') continue
    if (!msg.metadata) continue

    const meta = msg.metadata
    const ts = msg.timestamp ? new Date(msg.timestamp).getTime() : stat.mtime.getTime()
    if (ts > lastTs) lastTs = ts

    if (!model && meta.model) model = meta.model

    // Anthropic format
    if (meta.usage) {
      input += meta.usage.inputTokens ?? 0
      output += meta.usage.outputTokens ?? 0
      cacheRead += meta.usage.cacheReadInputTokens ?? 0
      cacheWrite += meta.usage.cacheCreationInputTokens ?? 0
      msgCount++
      continue
    }

    // OpenAI format in metadata.codebuff
    if (meta.codebuff?.usage) {
      const u = meta.codebuff.usage as OpenAIUsage
      input += u.prompt_tokens ?? 0
      output += u.completion_tokens ?? 0
      cacheRead += u.prompt_tokens_details?.cached_tokens ?? 0
      if (meta.codebuff.model && !model) model = meta.codebuff.model
      msgCount++
    }
  }

  if (input + output === 0 && msgCount === 0) return null

  const total = input + output + cacheRead + cacheWrite
  const lastActivity = new Date(lastTs)
  return {
    id: path.basename(path.dirname(chatFile)),
    project,
    messageCount: msgCount,
    tokens: { input, output, cacheRead, cacheWrite, total },
    model: model || 'unknown',
    lastActivity,
    created: stat.mtime,
    status: convStatus(lastActivity),
  }
}

const CODEBUFF_PLUGIN: TokenPlugin = {
  id: 'codebuff',
  name: 'Codebuff',
  icon: 'Bf',
  description: 'Tracks token usage from Codebuff AI sessions (~/.config/manicode/projects)',
  dataPath: CODEBUFF_BASE,

  async isAvailable(): Promise<boolean> {
    return pathExists(CODEBUFF_BASE)
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date(Date.now() - days * 86_400_000)

    // Structure: <base>/<channel>/projects/<project>/chats/<chat-id>/chat-messages.json
    const conversations: ConversationSummary[] = []

    let channels: string[]
    try { channels = await fs.readdir(CODEBUFF_BASE) } catch { return emptyPluginData('codebuff') }

    for (const channel of channels) {
      const projectsDir = path.join(CODEBUFF_BASE, channel, 'projects')
      let projects: string[]
      try { projects = await fs.readdir(projectsDir) } catch { continue }

      for (const project of projects) {
        const chatsDir = path.join(projectsDir, project, 'chats')
        let chats: string[]
        try { chats = await fs.readdir(chatsDir) } catch { continue }

        for (const chat of chats) {
          const chatFile = path.join(chatsDir, chat, 'chat-messages.json')
          const conv = await parseChatFile(chatFile, project, cutoff)
          if (conv) conversations.push(conv)
        }
      }
    }

    return buildPluginData('codebuff', conversations, options)
  },
}

export default CODEBUFF_PLUGIN
