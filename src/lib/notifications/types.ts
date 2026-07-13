export type NotificationSeverity = 'info' | 'warning' | 'critical'

export interface NotificationContext {
  dailyTokens: number
  dailyLimit: number
  pctOfLimit: number
}

export interface NotificationRule {
  id: string
  title: string
  body: (context: NotificationContext) => string
  check: (context: NotificationContext) => boolean
  severity: NotificationSeverity
}
