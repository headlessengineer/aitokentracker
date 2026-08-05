import type { ProviderLimit } from '@/lib/limits'

export type NotificationSeverity = 'info' | 'warning' | 'critical'

export interface NotificationContext {
  dailyTokens: number
  dailyLimit: number
  pctOfLimit: number
  providerLimits?: ProviderLimit[]
  yesterdayTokens?: number
  yesterdayCostUSD?: number
  topToolNameYesterday?: string
}

export interface NotificationRule {
  id: string
  title: string
  body: (context: NotificationContext) => string
  check: (context: NotificationContext) => boolean
  severity: NotificationSeverity
  onFired?: () => void
}
