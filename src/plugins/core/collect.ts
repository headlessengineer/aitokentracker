import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import type {
  PluginData,
  PluginSummary,
  TokenUsage,
  ConversationSummary,
  DailyActivity,
  ProjectStats,
  ModelStats,
  CollectOptions,
} from './types'

export function emptyUsage(): TokenUsage {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 }
}

export function emptyPluginData(pluginId: string): PluginData {
  return {
    pluginId,
    summary: {
      totalTokens: emptyUsage(),
      totalCostUSD: 0,
      totalConversations: 0,
      activeConversations: 0,
      topProjects: [],
      topModels: [],
      dailyActivity: [],
      dailyCost: [],
      lastActivity: null,
      conversations: [],
      topTools: [],
      subAgents: [],
      skills: [],
      mcpServers: [],
      hooks: [],
    },
    collectedAt: new Date().toISOString(),
  }
}

export function convStatus(lastActivity: Date): 'active' | 'recent' | 'inactive' {
  const ageDays = (Date.now() - lastActivity.getTime()) / 86_400_000
  return ageDays < 1 ? 'active' : ageDays < 7 ? 'recent' : 'inactive'
}

/** Build a PluginData from a flat list of ConversationSummary objects. */
export function buildPluginData(
  pluginId: string,
  conversations: ConversationSummary[],
  options: CollectOptions = {},
): PluginData {
  const { limit = 100 } = options

  const totalTokens = emptyUsage()
  const projectMap = new Map<string, ProjectStats>()
  const modelMap = new Map<string, ModelStats>()
  const dailyMap = new Map<string, DailyActivity>()

  for (const c of conversations) {
    totalTokens.input += c.tokens.input
    totalTokens.output += c.tokens.output
    totalTokens.cacheRead += c.tokens.cacheRead
    totalTokens.cacheWrite += c.tokens.cacheWrite
    totalTokens.total += c.tokens.total

    const dateKey = c.lastActivity.toISOString().slice(0, 10)
    const day = dailyMap.get(dateKey) ?? { date: dateKey, tokens: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, conversations: 0 }
    day.tokens += c.tokens.total
    day.input += c.tokens.input
    day.output += c.tokens.output
    day.cacheRead += c.tokens.cacheRead
    day.cacheWrite += c.tokens.cacheWrite
    day.conversations += 1
    dailyMap.set(dateKey, day)

    const proj = projectMap.get(c.project)
    if (proj) {
      proj.tokens += c.tokens.total
      proj.conversations += 1
      if (c.lastActivity > proj.lastActivity) proj.lastActivity = c.lastActivity
    } else {
      projectMap.set(c.project, {
        name: c.project,
        tokens: c.tokens.total,
        conversations: 1,
        lastActivity: c.lastActivity,
      })
    }

    if (c.model) {
      const m = modelMap.get(c.model)
      if (m) {
        m.tokens += c.tokens.total
        m.tokensDetail.input += c.tokens.input
        m.tokensDetail.output += c.tokens.output
        m.tokensDetail.cacheRead += c.tokens.cacheRead
        m.tokensDetail.cacheWrite += c.tokens.cacheWrite
        m.tokensDetail.total += c.tokens.total
        m.conversations += 1
      } else {
        modelMap.set(c.model, {
          model: c.model,
          tokens: c.tokens.total,
          tokensDetail: { ...c.tokens },
          conversations: 1,
        })
      }
    }
  }

  const sorted = [...conversations].sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
  const lastActivity = sorted.length > 0 ? sorted[0].lastActivity : null

  return {
    pluginId,
    summary: {
      totalTokens,
      totalCostUSD: 0,
      totalConversations: conversations.length,
      activeConversations: conversations.filter((c) => c.status === 'active').length,
      topProjects: [...projectMap.values()].sort((a, b) => b.tokens - a.tokens).slice(0, 10),
      topModels: [...modelMap.values()].sort((a, b) => b.tokens - a.tokens),
      dailyActivity: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      dailyCost: [],
      lastActivity,
      conversations: sorted.slice(0, limit),
      topTools: [],
      subAgents: [],
      skills: [],
      mcpServers: [],
      hooks: [],
    },
    collectedAt: new Date().toISOString(),
  }
}

/** Glob for files matching a pattern within a base directory. */
export async function globFiles(baseDir: string, ext: string): Promise<string[]> {
  const results: string[] = []
  async function walk(dir: string): Promise<void> {
    let entries: string[]
    try {
      entries = await fs.readdir(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry)
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try {
        stat = await fs.stat(full)
      } catch {
        continue
      }
      if (stat.isDirectory()) {
        await walk(full)
      } else if (entry.endsWith(ext)) {
        results.push(full)
      }
    }
  }
  await walk(baseDir)
  return results
}

/**
 * Parse a Claude-style JSONL file (used by Claude Code, Codex, Qwen, CommandCode, etc.).
 * Each line: { type: 'assistant', message: { usage: {...}, model: string } }
 * Returns { inputTokens, outputTokens, cacheRead, cacheWrite, model, messageCount }
 */
export interface JsonlUsage {
  inputTokens: number
  outputTokens: number
  cacheRead: number
  cacheWrite: number
  model: string
  messageCount: number
}

interface JsonlLine {
  type?: string
  message?: {
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_read_input_tokens?: number
      cache_creation_input_tokens?: number
    }
    model?: string
  }
  cwd?: string
}

export function parseClaudeStyleJsonl(raw: string): JsonlUsage {
  let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheWrite = 0
  let model = ''
  let messageCount = 0

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    let obj: JsonlLine
    try {
      obj = JSON.parse(line) as JsonlLine
    } catch {
      continue
    }
    if (obj.type !== 'assistant' || !obj.message) continue
    const u = obj.message.usage
    if (u) {
      inputTokens += u.input_tokens ?? 0
      outputTokens += u.output_tokens ?? 0
      cacheRead += u.cache_read_input_tokens ?? 0
      cacheWrite += u.cache_creation_input_tokens ?? 0
      messageCount++
    }
    if (obj.message.model && !model) model = obj.message.model
  }

  return { inputTokens, outputTokens, cacheRead, cacheWrite, model, messageCount }
}

/** Check if a path exists. */
export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/** Stat a file synchronously, return null on error. */
export function statSync(p: string): ReturnType<typeof fsSync.statSync> | null {
  try {
    return fsSync.statSync(p)
  } catch {
    return null
  }
}
