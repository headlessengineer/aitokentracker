import * as path from 'path'
import * as os from 'os'
import * as fsSync from 'fs'
import * as fs from 'fs/promises'
import * as https from 'https'
import { DatabaseSync } from 'node:sqlite'
import type {
  TokenPlugin,
  PluginData,
  CollectOptions,
  ConversationSummary,
  DailyActivity,
  DailyCost,
  ModelStats,
  AvailabilityResult,
} from '../core/types'
import { emptyPluginData, convStatus,
  availResult,
} from '../core/collect'
import { sinceDate } from '../../lib/since'

// ── Paths ──────────────────────────────────────────────────────────────────

const APP_DIR = path.join(os.homedir(), 'Library', 'Application Support', 'Cursor')
const STATE_DB = path.join(APP_DIR, 'User', 'globalStorage', 'state.vscdb')
const CLI_CONFIG = path.join(os.homedir(), '.cursor', 'cli-config.json')
const CSV_CACHE = path.join(os.homedir(), '.config', 'aitokentracker', 'cursor-usage.csv')
const CSV_MAX_AGE_MS = 60 * 60 * 1000 // refresh CSV at most every hour
const CSV_URL = 'https://cursor.com/api/dashboard/export-usage-events-csv?strategy=tokens'

// ── Auth extraction ─────────────────────────────────────────────────────────

function readJwt(): string | null {
  if (!fsSync.existsSync(STATE_DB)) return null
  let db: InstanceType<typeof DatabaseSync> | null = null
  try {
    db = new DatabaseSync(STATE_DB, { readOnly: true })
    const row = db
      .prepare("SELECT value FROM ItemTable WHERE key = 'cursorAuth/accessToken'")
      .get() as { value: string } | undefined
    return row?.value ? String(row.value) : null
  } catch {
    return null
  } finally {
    try { db?.close() } catch { /* ignore */ }
  }
}

const WORKOS_OAUTH_RE = /^(google-oauth2|github|oidc|auth0)\|[^|]+$/

function normalizeSub(sub: string): string | null {
  if (!sub) return null
  const native = sub.match(/\|(user_[A-Za-z0-9_]+)$/)
  if (native) return native[1]
  if (WORKOS_OAUTH_RE.test(sub)) return sub
  return null
}

function readUserId(jwt: string): string | null {
  // Try cli-config.json first (most reliable)
  try {
    const raw = fsSync.readFileSync(CLI_CONFIG, 'utf-8')
    const config = JSON.parse(raw) as { authInfo?: { authId?: string } }
    const id = normalizeSub(config?.authInfo?.authId ?? '')
    if (id) return id
  } catch { /* fall through */ }

  // Fall back to JWT payload .sub
  try {
    const parts = jwt.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as { sub?: string }
    return normalizeSub(payload.sub ?? '')
  } catch {
    return null
  }
}

function buildCookie(): string | null {
  const jwt = readJwt()
  if (!jwt) return null
  const userId = readUserId(jwt)
  if (!userId) return null
  return `WorkosCursorSessionToken=${userId}%3A%3A${jwt}`
}

// ── CSV fetch (with 1-hour file cache) ─────────────────────────────────────

function fetchFromApi(cookie: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(CSV_URL)
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          Accept: '*/*',
          Cookie: cookie,
          Referer: 'https://www.cursor.com/settings',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 20_000,
      },
      (res) => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          res.resume()
          return reject(new Error(`Cursor session expired (HTTP ${res.statusCode})`))
        }
        if (res.statusCode !== 200) {
          res.resume()
          return reject(new Error(`Cursor API returned HTTP ${res.statusCode}`))
        }
        let body = ''
        res.on('data', (chunk: Buffer) => { body += chunk.toString() })
        res.on('end', () => resolve(body))
        res.on('error', reject)
      },
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Cursor API timed out')) })
    req.end()
  })
}

async function loadCsv(cookie: string): Promise<string | null> {
  // Use disk cache if it's fresh enough
  try {
    const stat = fsSync.statSync(CSV_CACHE)
    if (Date.now() - stat.mtimeMs < CSV_MAX_AGE_MS) {
      return fsSync.readFileSync(CSV_CACHE, 'utf-8')
    }
  } catch { /* no cache yet */ }

  // Fetch and save
  try {
    const csv = await fetchFromApi(cookie)
    await fs.mkdir(path.dirname(CSV_CACHE), { recursive: true })
    await fs.writeFile(CSV_CACHE, csv, 'utf-8')
    return csv
  } catch {
    // On network failure fall back to stale cache if available
    try { return fsSync.readFileSync(CSV_CACHE, 'utf-8') } catch { return null }
  }
}

// ── CSV parsing ─────────────────────────────────────────────────────────────

interface CursorRow {
  dateKey: string // YYYY-MM-DD
  model: string
  input: number
  cacheWrite: number
  cacheRead: number
  output: number
  cost: number // from Cost column; reflects actual charge (may be $0 for Pro inclusions)
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; cur += ch }
    else if (ch === ',' && !inQ) { fields.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  fields.push(cur.trim())
  return fields
}

function stripQ(s: string): string {
  const t = s.trim()
  return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t
}

function toInt(s: string): number {
  const n = Number(stripQ(s))
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function toFloat(s: string): number {
  const n = Number(stripQ(s).replace(/[$,]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function parseCsv(text: string): CursorRow[] {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(stripQ)
  const col = (name: string) => headers.indexOf(name)

  const dateCol = col('Date')
  const modelCol = col('Model')
  const inputWithCol = col('Input (w/ Cache Write)')
  const inputWithoutCol = col('Input (w/o Cache Write)')
  const cacheReadCol = col('Cache Read')
  const outputCol = col('Output Tokens')
  const costCol = col('Cost')

  // Abort if any required column is missing (Cursor may change schema)
  if (
    [dateCol, modelCol, inputWithCol, inputWithoutCol, cacheReadCol, outputCol, costCol].some(
      (c) => c === -1,
    )
  ) {
    return []
  }

  const rows: CursorRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i])

    const rawDate = stripQ(f[dateCol] ?? '')
    // Normalize to YYYY-MM-DD (CSV may include timestamp)
    const dateKey = rawDate.split('T')[0].split(' ')[0]
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue

    const inputWith = toInt(f[inputWithCol] ?? '')
    const inputWithout = toInt(f[inputWithoutCol] ?? '')
    const cacheWrite = Math.max(0, inputWith - inputWithout)
    const cacheRead = toInt(f[cacheReadCol] ?? '')
    const output = toInt(f[outputCol] ?? '')
    const total = inputWithout + cacheWrite + cacheRead + output
    if (total === 0) continue

    rows.push({
      dateKey,
      model: stripQ(f[modelCol] ?? '') || 'cursor',
      input: inputWithout,
      cacheWrite,
      cacheRead,
      output,
      cost: toFloat(f[costCol] ?? ''),
    })
  }
  return rows
}

// ── Aggregation ─────────────────────────────────────────────────────────────

interface DayBucket {
  input: number; cacheWrite: number; cacheRead: number; output: number
  cost: number
  modelTokens: Map<string, number>
  requestCount: number
}

function aggregate(rows: CursorRow[], cutoff: Date, limit: number): PluginData {
  const dayMap = new Map<string, DayBucket>()

  for (const row of rows) {
    if (new Date(row.dateKey + 'T00:00:00Z') < cutoff) continue
    const b = dayMap.get(row.dateKey)
    if (b) {
      b.input += row.input
      b.cacheWrite += row.cacheWrite
      b.cacheRead += row.cacheRead
      b.output += row.output
      b.cost += row.cost
      b.modelTokens.set(row.model, (b.modelTokens.get(row.model) ?? 0) + row.input + row.output)
      b.requestCount++
    } else {
      dayMap.set(row.dateKey, {
        input: row.input, cacheWrite: row.cacheWrite, cacheRead: row.cacheRead,
        output: row.output, cost: row.cost,
        modelTokens: new Map([[row.model, row.input + row.output]]),
        requestCount: 1,
      })
    }
  }

  let totalInput = 0, totalCacheWrite = 0, totalCacheRead = 0, totalOutput = 0
  let totalCost = 0
  const dailyActivity: DailyActivity[] = []
  const dailyCost: DailyCost[] = []
  const conversations: ConversationSummary[] = []
  const modelMap = new Map<string, ModelStats>()

  for (const [dateKey, b] of [...dayMap.entries()].sort()) {
    const total = b.input + b.cacheWrite + b.cacheRead + b.output
    totalInput += b.input
    totalCacheWrite += b.cacheWrite
    totalCacheRead += b.cacheRead
    totalOutput += b.output
    totalCost += b.cost

    dailyActivity.push({
      date: dateKey,
      tokens: total,
      input: b.input,
      output: b.output,
      cacheRead: b.cacheRead,
      cacheWrite: b.cacheWrite,
      conversations: b.requestCount,
    })
    if (b.cost > 0) dailyCost.push({ date: dateKey, costUSD: b.cost })

    // Dominant model for this day's "session"
    let bestModel = 'cursor'
    let bestTokens = 0
    for (const [m, t] of b.modelTokens) {
      if (t > bestTokens) { bestModel = m; bestTokens = t }
      const existing = modelMap.get(m)
      if (existing) {
        existing.tokens += t
        existing.tokensDetail.total += t
        existing.conversations++
      } else {
        modelMap.set(m, {
          model: m,
          tokens: t,
          tokensDetail: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: t },
          conversations: 1,
        })
      }
    }

    const dayStart = new Date(dateKey + 'T00:00:00Z')
    const dayEnd = new Date(dateKey + 'T23:59:59Z')
    conversations.push({
      id: dateKey,
      project: 'cursor',
      messageCount: b.requestCount,
      tokens: {
        input: b.input, output: b.output,
        cacheRead: b.cacheRead, cacheWrite: b.cacheWrite,
        total,
      },
      model: bestModel,
      lastActivity: dayEnd,
      created: dayStart,
      status: convStatus(dayEnd),
    })
  }

  // Newest first for conversation table
  conversations.reverse()

  const totalTotal = totalInput + totalCacheWrite + totalCacheRead + totalOutput
  const lastActivity = conversations.length > 0 ? conversations[0].lastActivity : null

  return {
    pluginId: 'cursor',
    summary: {
      totalTokens: {
        input: totalInput, output: totalOutput,
        cacheRead: totalCacheRead, cacheWrite: totalCacheWrite,
        total: totalTotal,
      },
      totalCostUSD: totalCost,
      totalConversations: conversations.length,
      activeConversations: conversations.filter((c) => c.status === 'active').length,
      topProjects: [],
      topModels: [...modelMap.values()].sort((a, b) => b.tokens - a.tokens),
      dailyActivity,
      dailyCost,
      lastActivity,
      conversations: conversations.slice(0, limit),
      topTools: [], subAgents: [], skills: [], mcpServers: [], hooks: [], hourlyActivity: [], cacheRoiUSD: 0, dailyCostWithoutCache: [], modelShareByDay: [],
    },
    collectedAt: new Date().toISOString(),
  }
}

// ── Plugin definition ───────────────────────────────────────────────────────

const CURSOR_PLUGIN: TokenPlugin = {
  id: 'cursor',
  name: 'Cursor',
  icon: 'Cu',
  description: 'Tracks token usage from Cursor AI editor sessions via the Cursor usage API',
  dataPath: '', // no local data files; plugin manages its own CSV cache
  capabilities: {
    cost: true,
    models: true,
    projects: false, // Cursor CSV has no project concept
    sessions: true,
    rateLimit: false,
  },

  async isAvailable(): Promise<AvailabilityResult> {
    // Available when Cursor is installed AND the user has a local auth token
    return availResult(fsSync.existsSync(STATE_DB))
  },

  async collect(options: CollectOptions = {}): Promise<PluginData> {
    const { days = 30, limit = 100 } = options

    const cookie = buildCookie()
    if (!cookie) return emptyPluginData('cursor')

    const csv = await loadCsv(cookie)
    if (!csv) return emptyPluginData('cursor')

    const rows = parseCsv(csv)
    if (rows.length === 0) return emptyPluginData('cursor')

    const cutoff = sinceDate(days)
    return aggregate(rows, cutoff, limit)
  },
}

export default CURSOR_PLUGIN
