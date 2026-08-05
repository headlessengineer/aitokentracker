import * as fs from 'fs/promises'
import * as fsSync from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { DatabaseSync } from 'node:sqlite'
import type {
  TokenPlugin,
  PluginData,
  CollectOptions,
  ConversationSummary,
  DailyActivity,
  DailyCost,
  ProjectStats,
  ToolCallStats,
  AvailabilityResult,
} from '../core/types'
import { getCostUSD } from '../../lib/pricing'
import { sinceDate } from '../../lib/since'

const GEMINI_DIR = path.join(os.homedir(), '.gemini')
const ANTIGRAVITY_CLI_DIR = path.join(GEMINI_DIR, 'antigravity-cli')
const CONVERSATIONS_DIR = path.join(ANTIGRAVITY_CLI_DIR, 'conversations')
const BRAIN_DIR = path.join(ANTIGRAVITY_CLI_DIR, 'brain')
const HISTORY_FILE = path.join(ANTIGRAVITY_CLI_DIR, 'history.jsonl')

interface HistoryEntry {
  conversationId?: string
  workspace?: string
  timestamp?: number
}

interface TranscriptEntry {
  type: string
  tool_calls?: Array<{ name: string }>
}

// ---- minimal protobuf varint + field skipper ----

function decodeVarint(data: Buffer, pos: number): [number, number] {
  let result = 0
  let shift = 0
  while (pos < data.length) {
    const b = data[pos++]
    result |= (b & 0x7f) << shift
    shift += 7
    if (!(b & 0x80)) return [result, pos]
  }
  return [result, pos]
}

function skipField(data: Buffer, pos: number, wireType: number): number {
  if (wireType === 0) {
    const [, next] = decodeVarint(data, pos)
    return next
  }
  if (wireType === 1) return pos + 8
  if (wireType === 2) {
    const [len, next] = decodeVarint(data, pos)
    return next + len
  }
  if (wireType === 5) return pos + 4
  return pos + 1
}

/** Sum input/output tokens from the innermost token-usage message. */
function extractTokensInner(data: Buffer): [number, number] {
  let inputT = 0
  let outputT = 0
  let pos = 0
  while (pos < data.length) {
    try {
      const [tag, next] = decodeVarint(data, pos)
      pos = next
      const field = tag >> 3
      const wire = tag & 0x07
      if (field === 2 && wire === 0) {
        const [v, p] = decodeVarint(data, pos)
        inputT += v
        pos = p
      } else if (field === 3 && wire === 0) {
        const [v, p] = decodeVarint(data, pos)
        outputT += v
        pos = p
      } else {
        pos = skipField(data, pos, wire)
      }
    } catch {
      break
    }
  }
  return [inputT, outputT]
}

/**
 * Parse a gen_metadata blob.
 * Layout: top-level field 1 (LEN) → field 4 (LEN) → field 2 (input varint), field 3 (output varint).
 */
function parseGenMetadataBlob(data: Buffer): [number, number] {
  let inputT = 0
  let outputT = 0
  let pos = 0
  while (pos < data.length) {
    try {
      const [tag, next] = decodeVarint(data, pos)
      pos = next
      const field = tag >> 3
      const wire = tag & 0x07
      if (field === 1 && wire === 2) {
        const [len, npos] = decodeVarint(data, pos)
        const nested = data.subarray(npos, npos + len)
        pos = npos + len
        let np = 0
        while (np < nested.length) {
          try {
            const [ntag, nnext] = decodeVarint(nested, np)
            np = nnext
            const nfield = ntag >> 3
            const nwire = ntag & 0x07
            if (nfield === 4 && nwire === 2) {
              const [nlen, npnext] = decodeVarint(nested, np)
              const inner = nested.subarray(npnext, npnext + nlen)
              np = npnext + nlen
              const [inp, outp] = extractTokensInner(inner)
              inputT += inp
              outputT += outp
            } else {
              np = skipField(nested, np, nwire)
            }
          } catch {
            break
          }
        }
      } else {
        pos = skipField(data, pos, wire)
      }
    } catch {
      break
    }
  }
  return [inputT, outputT]
}

/** Extract the display model name from a gen_metadata blob via ASCII marker search. */
function extractModelName(data: Buffer): string | null {
  const markers = [Buffer.from('Claude '), Buffer.from('Gemini '), Buffer.from('GPT-')]
  for (const marker of markers) {
    const idx = data.indexOf(marker)
    if (idx < 0) continue
    let end = idx
    while (end < data.length && data[end] >= 32 && data[end] < 127) end++
    const name = data.subarray(idx, end).toString('utf8').trim()
    if (name.length > 3) return name
  }
  return null
}

async function readHistoryMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf-8')
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      try {
        const entry = JSON.parse(line) as HistoryEntry
        if (entry.conversationId && entry.workspace) {
          map.set(entry.conversationId, entry.workspace)
        }
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // history file missing
  }
  return map
}

async function readTranscriptToolCalls(uuid: string): Promise<Map<string, number>> {
  const toolTotals = new Map<string, number>()
  const transcriptPath = path.join(
    BRAIN_DIR,
    uuid,
    '.system_generated',
    'logs',
    'transcript.jsonl',
  )
  try {
    const raw = await fs.readFile(transcriptPath, 'utf-8')
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      try {
        const entry = JSON.parse(line) as TranscriptEntry
        if (entry.type === 'PLANNER_RESPONSE' && entry.tool_calls) {
          for (const tc of entry.tool_calls) {
            toolTotals.set(tc.name, (toolTotals.get(tc.name) ?? 0) + 1)
          }
        }
      } catch {
        // skip
      }
    }
  } catch {
    // transcript missing — tool counts stay 0
  }
  return toolTotals
}

interface ConvData {
  uuid: string
  inputTokens: number
  outputTokens: number
  model: string
  lastActivity: Date
  stepCount: number
  userMessageCount: number
}

async function readConversationDB(uuid: string): Promise<ConvData | null> {
  const dbPath = path.join(CONVERSATIONS_DIR, `${uuid}.db`)
  if (!fsSync.existsSync(dbPath)) return null
  const { DatabaseSync } = await import('node:sqlite')
  let db: DatabaseSync | null = null
  try {
    db = new DatabaseSync(dbPath, { readOnly: true })

    let inputTokens = 0
    let outputTokens = 0
    let model: string | null = null

    // node:sqlite returns blobs as Uint8Array; wrap to Buffer for protobuf decoder
    const rows = db.prepare('SELECT data FROM gen_metadata').all() as Array<{ data: Uint8Array }>
    for (const row of rows) {
      const buf = Buffer.from(row.data)
      const [inp, outp] = parseGenMetadataBlob(buf)
      inputTokens += inp
      outputTokens += outp
      if (!model) model = extractModelName(buf)
    }

    const stepRow = db.prepare('SELECT COUNT(*) as n FROM steps').get() as { n: number }
    const stepCount = stepRow.n
    const userRow = db
      .prepare('SELECT COUNT(*) as n FROM steps WHERE step_type = 14')
      .get() as { n: number }
    const userMessageCount = userRow.n

    const stat = fsSync.statSync(dbPath)

    return {
      uuid,
      inputTokens,
      outputTokens,
      model: model ?? 'Unknown',
      lastActivity: stat.mtime,
      stepCount,
      userMessageCount,
    }
  } catch {
    return null
  } finally {
    try {
      db?.close()
    } catch {
      // ignore close errors
    }
  }
}

const ANTIGRAVITY_PLUGIN: TokenPlugin = {
  id: 'antigravity',
  name: 'Antigravity',
  icon: 'AG',
  description: 'Tracks sessions from Antigravity CLI (agy) at ~/.gemini/antigravity-cli',
  dataPath: ANTIGRAVITY_CLI_DIR,

  async isAvailable(): Promise<AvailabilityResult> {
    try {
      await fs.access(CONVERSATIONS_DIR)
      return { available: true }
    } catch {
      return { available: false, reason: 'path_missing' }
    }
  },

  async collect(options?: CollectOptions): Promise<PluginData> {
    const days = options?.days ?? 30
    const cutoff = sinceDate(days)

    const historyMap = await readHistoryMap()

    let uuids: string[] = []
    try {
      const entries = await fs.readdir(CONVERSATIONS_DIR)
      uuids = entries
        .filter((e) => e.endsWith('.db') && !e.endsWith('-shm') && !e.endsWith('-wal'))
        .map((e) => e.slice(0, -3))
    } catch {
      // directory unreadable
    }

    const dailyMap = new Map<string, DailyActivity>()
    const conversations: ConversationSummary[] = []
    const globalToolTotals = new Map<string, number>()
    const projectMap = new Map<string, ProjectStats>()
    const costMap = new Map<string, number>()

    let totalInput = 0
    let totalOutput = 0
    let totalCostUSD = 0

    for (const uuid of uuids) {
      const conv = await readConversationDB(uuid)
      if (!conv) continue
      if (conv.lastActivity < cutoff) continue

      totalInput += conv.inputTokens
      totalOutput += conv.outputTokens

      const convCost = getCostUSD(conv.model, conv.inputTokens, conv.outputTokens, 0, 0)
      totalCostUSD += convCost

      const dateKey = conv.lastActivity.toISOString().slice(0, 10)
      costMap.set(dateKey, (costMap.get(dateKey) ?? 0) + convCost)
      const dayTotal = conv.inputTokens + conv.outputTokens
      const day = dailyMap.get(dateKey) ?? { date: dateKey, tokens: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, conversations: 0 }
      day.conversations += 1
      day.tokens += dayTotal
      day.input += conv.inputTokens
      day.output += conv.outputTokens
      dailyMap.set(dateKey, day)

      const toolCounts = await readTranscriptToolCalls(uuid)
      for (const [name, count] of toolCounts) {
        globalToolTotals.set(name, (globalToolTotals.get(name) ?? 0) + count)
      }

      const workspace = historyMap.get(uuid)
      const project = workspace ? path.basename(workspace) : 'Unknown'

      const ageDays = (Date.now() - conv.lastActivity.getTime()) / 86_400_000
      conversations.push({
        id: uuid,
        project,
        messageCount: conv.userMessageCount,
        tokens: {
          input: conv.inputTokens,
          output: conv.outputTokens,
          cacheRead: 0,
          cacheWrite: 0,
          total: conv.inputTokens + conv.outputTokens,
        },
        model: conv.model,
        lastActivity: conv.lastActivity,
        created: conv.lastActivity,
        status: ageDays < 1 ? 'active' : ageDays < 7 ? 'recent' : 'inactive',
      })

      const existing = projectMap.get(project) ?? {
        name: project,
        tokens: 0,
        conversations: 0,
        costUSD: 0,
        lastActivity: conv.lastActivity,
      }
      existing.conversations += 1
      existing.tokens += conv.inputTokens + conv.outputTokens
      if (conv.lastActivity > existing.lastActivity) existing.lastActivity = conv.lastActivity
      projectMap.set(project, existing)
    }

    const topTools: ToolCallStats[] = [...globalToolTotals.entries()]
      .map(([name, callCount]) => ({ name, callCount, category: 'core' as const }))
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, 20)

    const dailyCost: DailyCost[] = [...costMap.entries()]
      .map(([date, costUSD]) => ({ date, costUSD }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const lastActivity =
      conversations.length > 0
        ? new Date(Math.max(...conversations.map((c) => c.lastActivity.getTime())))
        : null

    const modelMap = new Map<string, { tokens: number; tokensDetail: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number }; conversations: number }>()
    for (const c of conversations) {
      const existing = modelMap.get(c.model) ?? {
        tokens: 0,
        tokensDetail: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
        conversations: 0,
      }
      existing.conversations += 1
      existing.tokens += c.tokens.total
      existing.tokensDetail.input += c.tokens.input
      existing.tokensDetail.output += c.tokens.output
      existing.tokensDetail.cacheRead += c.tokens.cacheRead
      existing.tokensDetail.cacheWrite += c.tokens.cacheWrite
      existing.tokensDetail.total += c.tokens.total
      modelMap.set(c.model, existing)
    }
    const topModels = [...modelMap.entries()]
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.tokens - a.tokens)

    return {
      pluginId: 'antigravity',
      summary: {
        totalTokens: {
          input: totalInput,
          output: totalOutput,
          cacheRead: 0,
          cacheWrite: 0,
          total: totalInput + totalOutput,
        },
        totalCostUSD,
        totalConversations: conversations.length,
        activeConversations: conversations.filter((c) => c.status === 'active').length,
        topProjects: [...projectMap.values()]
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
          .slice(0, 10),
        topModels,
        dailyActivity: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
        dailyCost,
        lastActivity,
        conversations: conversations
          .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
          .slice(0, 50),
        topTools,
        subAgents: [],
        skills: [],
        mcpServers: [],
        hooks: [],
        hourlyActivity: [],
        cacheRoiUSD: 0,
        dailyCostWithoutCache: [],
        modelShareByDay: [],
      },
      collectedAt: new Date().toISOString(),
    }
  },
}

export default ANTIGRAVITY_PLUGIN
