import type { NotificationRule } from './types'

export const DAILY_TOKEN_LIMIT = 50_000_000

const fmt = (n: number) => (n / 1_000_000).toFixed(1) + 'M'
const limitStr = fmt(DAILY_TOKEN_LIMIT)

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
]
