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

const ANTIGRAVITY_DIR = path.join(os.homedir(), '.gemini', 'antigravity')
const CONVERSATIONS_DIR = path.join(ANTIGRAVITY_DIR, 'conversations')
const BRAIN_DIR = path.join(ANTIGRAVITY_DIR, 'brain')
const DEFAULT_MODEL = 'gemini-2.5-pro'

interface BrainMetadata {
  artifactType?: string
  summary?: string
  updatedAt?: string
}

const ANTIGRAVITY_PLUGIN: TokenPlugin = {
  id: 'antigravity',
  name: 'Antigravity',
  icon: 'AG',
  description: 'Tracks sessions from Google Antigravity agentic IDE (~/.gemini/antigravity)',
  dataPath: ANTIGRAVITY_DIR,

  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(ANTIGRAVITY_DIR)
      return true
    } catch {
      return false
    }
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    // Conversations are stored as binary protobuf (.pb) files
    // Token data is not extractable — track counts and activity from file metadata
    const pbFiles = (await fs.readdir(CONVERSATIONS_DIR).catch(() => [] as string[])).filter((f) =>
      f.endsWith('.pb'),
    )

    const dailyMap = new Map<string, DailyActivity>()
    const conversations: ConversationSummary[] = []

    for (const pb of pbFiles) {
      const pbPath = path.join(CONVERSATIONS_DIR, pb)
      let stat: Awaited<ReturnType<typeof fs.stat>>
      try {
        stat = await fs.stat(pbPath)
      } catch {
        continue
      }

      const mtime = new Date(stat.mtime)
      if (mtime < cutoff) continue

      const id = pb.replace('.pb', '')
      const dateKey = mtime.toISOString().slice(0, 10)
      const day = dailyMap.get(dateKey) ?? { date: dateKey, tokens: 0, conversations: 0 }
      day.conversations += 1
      dailyMap.set(dateKey, day)

      const ageDays = (Date.now() - mtime.getTime()) / 86_400_000
      conversations.push({
        id,
        project: 'Antigravity',
        messageCount: 0,
        tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        model: DEFAULT_MODEL,
        lastActivity: mtime,
        created: new Date(stat.birthtime),
        status: ageDays < 1 ? 'active' : ageDays < 7 ? 'recent' : 'inactive',
      })
    }

    // Brain directory contains project-level task metadata with summaries
    const projectMap = new Map<string, ProjectStats>()
    const brainDirs = await fs.readdir(BRAIN_DIR).catch(() => [] as string[])

    for (const bDir of brainDirs) {
      const metaDir = path.join(BRAIN_DIR, bDir)
      let metaFiles: string[] = []
      try {
        metaFiles = await fs.readdir(metaDir)
      } catch {
        continue
      }

      for (const f of metaFiles) {
        if (!f.endsWith('.metadata.json')) continue
        try {
          const raw = await fs.readFile(path.join(metaDir, f), 'utf-8')
          const meta = JSON.parse(raw) as BrainMetadata
          if (!meta.updatedAt) continue
          const updatedAt = new Date(meta.updatedAt)
          if (updatedAt < cutoff) continue

          // Use a truncated summary as project name
          const projName = (meta.summary ?? '').slice(0, 48).replace(/\s+/g, ' ') || bDir.slice(0, 12)
          const existing = projectMap.get(bDir) ?? {
            name: projName,
            tokens: 0,
            conversations: 1,
            lastActivity: updatedAt,
          }
          if (updatedAt > existing.lastActivity) {
            existing.lastActivity = updatedAt
            existing.name = projName
          }
          projectMap.set(bDir, existing)
        } catch {
          continue
        }
      }
    }

    const lastActivity =
      conversations.length > 0
        ? new Date(Math.max(...conversations.map((c) => c.lastActivity.getTime())))
        : null

    return {
      pluginId: 'antigravity',
      summary: {
        // Token counts are unavailable from binary .pb format
        totalTokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        topProjects: [...projectMap.values()]
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
          .slice(0, 10),
        topModels:
          conversations.length > 0
            ? [{ model: DEFAULT_MODEL, tokens: 0, conversations: conversations.length }]
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

export default ANTIGRAVITY_PLUGIN
