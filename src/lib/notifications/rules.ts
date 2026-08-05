import type { NotificationRule } from './types'

export const DAILY_TOKEN_LIMIT = 50_000_000

const fmt = (n: number) => (n / 1_000_000).toFixed(1) + 'M'
const limitStr = fmt(DAILY_TOKEN_LIMIT)

const fmtTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n)

const fmtCost = (n: number) =>
  `$${n < 0.01 ? n.toFixed(4) : n < 1 ? n.toFixed(2) : n.toFixed(0)}`

const DIGEST_ENABLED_KEY = 'aitokentracker:digest_enabled'
const DIGEST_DATE_KEY = 'aitokentracker:digest_date'

function isDigestEnabled(): boolean {
  try { return localStorage.getItem(DIGEST_ENABLED_KEY) === 'true' } catch { return false }
}

function getDigestDate(): string {
  try { return localStorage.getItem(DIGEST_DATE_KEY) ?? '' } catch { return '' }
}

export function setDigestEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DIGEST_ENABLED_KEY, 'true')
    } else {
      localStorage.removeItem(DIGEST_ENABLED_KEY)
    }
  } catch { /* localStorage unavailable */ }
}

export function getDigestEnabled(): boolean {
  return isDigestEnabled()
}

export const DEFAULT_RULES: NotificationRule[] = [
  {
    id: 'daily_limit_reached',
    title: 'Daily token limit reached',
    body: (ctx) =>
      `You've used ${fmt(ctx.dailyTokens)} tokens today — the ${limitStr} daily limit.`,
    check: (ctx) => ctx.pctOfLimit >= 100,
    severity: 'critical',
  },
  {
    id: 'daily_usage_75pct',
    title: 'Token usage at 75%',
    body: (ctx) =>
      `${fmt(ctx.dailyTokens)} of ${limitStr} daily tokens used (${Math.round(ctx.pctOfLimit)}%).`,
    check: (ctx) => ctx.pctOfLimit >= 75 && ctx.pctOfLimit < 100,
    severity: 'warning',
  },
  {
    id: 'daily_usage_50pct',
    title: 'Token usage at 50%',
    body: (ctx) =>
      `${fmt(ctx.dailyTokens)} of ${limitStr} daily tokens used (${Math.round(ctx.pctOfLimit)}%).`,
    check: (ctx) => ctx.pctOfLimit >= 50 && ctx.pctOfLimit < 75,
    severity: 'info',
  },
  {
    id: 'rate_limit_warning',
    title: 'Rate limit approaching',
    body: (ctx) => {
      const near = ctx.providerLimits?.filter((l) => l.total > 0 && l.pct >= 80) ?? []
      const first = near[0]
      if (!first) return ''
      return `${first.provider} is at ${Math.round(first.pct)}% of its ${first.unit} limit (${first.used.toLocaleString()} / ${first.total.toLocaleString()}).`
    },
    check: (ctx) =>
      (ctx.providerLimits ?? []).some((l) => l.total > 0 && l.pct >= 80),
    severity: 'warning',
  },
  {
    id: 'daily_digest',
    title: 'Your AI usage yesterday',
    body: (ctx) => {
      const tokens = ctx.yesterdayTokens ?? 0
      const cost = ctx.yesterdayCostUSD ?? 0
      const tool = ctx.topToolNameYesterday ?? ''
      const parts = [`${fmtTokens(tokens)} tokens`]
      if (cost > 0) parts.push(fmtCost(cost))
      if (tool) parts.push(`Top: ${tool}`)
      return parts.join(' · ')
    },
    check: (ctx) => {
      if (!isDigestEnabled()) return false
      if (!ctx.yesterdayTokens) return false
      const today = new Date().toISOString().split('T')[0]
      return getDigestDate() !== today
    },
    onFired: () => {
      const today = new Date().toISOString().split('T')[0]
      try { localStorage.setItem(DIGEST_DATE_KEY, today) } catch { /* silent */ }
    },
    severity: 'info',
  },
]
