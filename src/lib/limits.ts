import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface ProviderLimit {
  provider: string
  pluginId: string
  used: number
  total: number    // 0 = limit unknown; still useful to show raw usage
  unit: 'messages' | 'tokens' | 'requests' | 'USD'
  resetAt: Date | null
  pct: number      // 0–100; 0 when total is 0
}

// ── Claude Code ─────────────────────────────────────────────────────────────
// Claude Code tracks daily message counts in stats-cache.json.
// The limit depends on the user's plan; 2000 is a conservative default for
// Max 20x users. The reset window is midnight local time.

export const CLAUDE_DEFAULT_MESSAGE_LIMIT = 2000

interface StatsCache {
  dailyActivity?: Array<{ date: string; messageCount?: number }>
}

async function readClaudeMessageCount(): Promise<ProviderLimit | null> {
  const statsPath = path.join(
    process.env.CLAUDE_CONFIG_DIR ?? path.join(os.homedir(), '.claude'),
    'stats-cache.json',
  )
  try {
    const raw = await fs.readFile(statsPath, 'utf-8')
    const data = JSON.parse(raw) as StatsCache
    if (!Array.isArray(data.dailyActivity) || data.dailyActivity.length === 0) return null

    const today = new Date().toISOString().split('T')[0]
    const todayEntry = data.dailyActivity.find((d) => d.date === today)

    const resetAt = new Date()
    resetAt.setDate(resetAt.getDate() + 1)
    resetAt.setHours(0, 0, 0, 0)

    const total = CLAUDE_DEFAULT_MESSAGE_LIMIT

    if (todayEntry) {
      const used = todayEntry.messageCount ?? 0
      return {
        provider: 'Claude Code',
        pluginId: 'claude',
        used,
        total,
        unit: 'messages',
        resetAt,
        pct: total > 0 ? Math.min(100, (used / total) * 100) : 0,
      }
    }

    // stats-cache updates at session end — fall back to the most recent available day
    const sorted = [...data.dailyActivity].sort((a, b) => b.date.localeCompare(a.date))
    const latest = sorted[0]
    const used = latest.messageCount ?? 0
    const shortDate = latest.date.slice(5).replace('-', '/')
    return {
      provider: `Claude Code (${shortDate})`,
      pluginId: 'claude',
      used,
      total,
      unit: 'messages',
      resetAt: null,
      pct: total > 0 ? Math.min(100, (used / total) * 100) : 0,
    }
  } catch {
    return null
  }
}

// ── In-memory cache (5-minute TTL) ─────────────────────────────────────────
// Next.js server process is long-lived in dev; this avoids stat-ing the
// same files on every request. In production (single machine, not serverless)
// this also works correctly.

const g = globalThis as typeof globalThis & {
  __aitLimitsCache?: ProviderLimit[]
  __aitLimitsCacheExpiry?: number
}

const CACHE_TTL_MS = 5 * 60 * 1000

export async function readAllLimits(): Promise<ProviderLimit[]> {
  if (g.__aitLimitsCache && Date.now() < (g.__aitLimitsCacheExpiry ?? 0)) {
    return g.__aitLimitsCache
  }

  const limits: ProviderLimit[] = []

  const claude = await readClaudeMessageCount()
  if (claude) limits.push(claude)

  g.__aitLimitsCache = limits
  g.__aitLimitsCacheExpiry = Date.now() + CACHE_TTL_MS
  return limits
}

/** Invalidate the in-memory cache (call after manual refresh). */
export function invalidateLimitsCache(): void {
  g.__aitLimitsCache = undefined
  g.__aitLimitsCacheExpiry = 0
}
