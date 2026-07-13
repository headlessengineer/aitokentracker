import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import type {
  TokenPlugin,
  PluginData,
  CollectOptions,
  ConversationSummary,
  DailyActivity,
  ProjectStats,
} from '../core/types'

const GEMINI_TMP_DIR = path.join(os.homedir(), '.gemini', 'tmp')
const DEFAULT_MODEL = 'gemini-2.5-pro'
// Gemini CLI logs only store user messages; 4 chars ≈ 1 input token, output ≈ 60% of input
const CHARS_PER_TOKEN = 4
const OUTPUT_RATIO = 0.6

interface GeminiLogEntry {
  sessionId: string
  messageId: number
  type: string
  message: string
  timestamp: string
}

const GEMINI_PLUGIN: TokenPlugin = {
  id: 'gemini',
  name: 'Gemini CLI',
  icon: 'G',
  description: 'Tracks usage from Google Gemini CLI agentic coding sessions (~/.gemini/tmp)',
  dataPath: GEMINI_TMP_DIR,

  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(GEMINI_TMP_DIR)
      return true
    } catch {
      return false
    }
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const dirs = await fs.readdir(GEMINI_TMP_DIR).catch(() => [] as string[])

    const dailyMap = new Map<string, DailyActivity>()
    const projectMap = new Map<string, ProjectStats>()
    const conversations: ConversationSummary[] = []
    let totalInput = 0
    let totalOutput = 0

    for (const dir of dirs) {
      const logPath = path.join(GEMINI_TMP_DIR, dir, 'logs.json')

      let entries: GeminiLogEntry[] = []
      try {
        const raw = await fs.readFile(logPath, 'utf-8')
        entries = JSON.parse(raw) as GeminiLogEntry[]
      } catch {
        continue
      }

      // Group entries by sessionId — each session = one conversation
      const sessions = new Map<string, GeminiLogEntry[]>()
      for (const entry of entries) {
        if (!entry.sessionId || !entry.timestamp) continue
        const list = sessions.get(entry.sessionId) ?? []
        list.push(entry)
        sessions.set(entry.sessionId, list)
      }

      for (const [sessionId, msgs] of sessions) {
        const sorted = msgs.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        const lastTs = new Date(sorted[sorted.length - 1].timestamp)
        const firstTs = new Date(sorted[0].timestamp)

        if (lastTs < cutoff) continue

        const totalChars = msgs.reduce((sum, m) => sum + (m.message?.length ?? 0), 0)
        const estimatedInput = Math.ceil(totalChars / CHARS_PER_TOKEN)
        const estimatedOutput = Math.ceil(estimatedInput * OUTPUT_RATIO)
        totalInput += estimatedInput
        totalOutput += estimatedOutput

        const dateKey = lastTs.toISOString().slice(0, 10)
        const day = dailyMap.get(dateKey) ?? { date: dateKey, tokens: 0, conversations: 0 }
        day.tokens += estimatedInput + estimatedOutput
        day.conversations += 1
        dailyMap.set(dateKey, day)

        // Use first 12 chars of the project hash as display id
        const projectId = dir.slice(0, 12)
        const proj = projectMap.get(projectId) ?? {
          name: projectId,
          tokens: 0,
          conversations: 0,
          lastActivity: lastTs,
        }
        proj.tokens += estimatedInput + estimatedOutput
        proj.conversations += 1
        if (lastTs > proj.lastActivity) proj.lastActivity = lastTs
        projectMap.set(projectId, proj)

        const ageDays = (Date.now() - lastTs.getTime()) / 86_400_000
        conversations.push({
          id: sessionId,
          project: projectId,
          messageCount: msgs.length,
          tokens: {
            input: estimatedInput,
            output: estimatedOutput,
            cacheRead: 0,
            cacheWrite: 0,
            total: estimatedInput + estimatedOutput,
          },
          model: DEFAULT_MODEL,
          lastActivity: lastTs,
          created: firstTs,
          status: ageDays < 1 ? 'active' : ageDays < 7 ? 'recent' : 'inactive',
        })
      }
    }

    const totalTokens = totalInput + totalOutput
    const lastActivity =
      conversations.length > 0
        ? new Date(Math.max(...conversations.map((c) => c.lastActivity.getTime())))
        : null

    return {
      pluginId: 'gemini',
      summary: {
        totalTokens: {
          input: totalInput,
          output: totalOutput,
          cacheRead: 0,
          cacheWrite: 0,
          total: totalTokens,
        },
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        topProjects: [...projectMap.values()]
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 10),
        topModels:
          totalTokens > 0
            ? [{ model: DEFAULT_MODEL, tokens: totalTokens, conversations: conversations.length }]
            : [],
        dailyActivity: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
        lastActivity,
        conversations: conversations
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
          .slice(0, 50),
        topTools: [],
        subAgents: [],
        skills: [],
        mcpServers: [],
        hooks: [],
      },
      collectedAt: new Date().toISOString(),
    }
  },
}

export default GEMINI_PLUGIN
