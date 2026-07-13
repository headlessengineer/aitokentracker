import type { NotificationRule, NotificationContext } from './types'
import { DEFAULT_RULES } from './rules'

const SESSION_KEY = 'aitokentracker:notif_fired'

function getFired(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function markFired(id: string): void {
  try {
    const fired = getFired()
    fired.add(id)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...fired]))
  } catch {
    // sessionStorage unavailable — silent fail
  }
}

export class NotificationManager {
  private rules: NotificationRule[]

  constructor(rules: NotificationRule[] = DEFAULT_RULES) {
    this.rules = [...rules]
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  evaluate(context: NotificationContext): void {
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return
    const fired = getFired()
    for (const rule of this.rules) {
      if (fired.has(rule.id)) continue
      if (!rule.check(context)) continue
      new Notification(rule.title, {
        body: rule.body(context),
        requireInteraction: true,
        tag: rule.id,
        icon: '/favicon.ico',
      })
      markFired(rule.id)
    }
  }

  // Fires a notification immediately, bypassing check() and sessionStorage.
  // Useful for testing from the browser console. Uses a representative context
  // if none is provided so message bodies render with realistic values.
  async test(ruleId?: string, context?: NotificationContext): Promise<void> {
    const granted = await this.requestPermission()
    if (!granted) {
      console.warn('[aitokentracker] Notification permission not granted — enable it in browser site settings.')
      return
    }
    const targets = ruleId ? this.rules.filter((r) => r.id === ruleId) : this.rules
    if (ruleId && targets.length === 0) {
      console.warn(`[aitokentracker] Unknown rule id: "${ruleId}". Available:`, this.ruleIds())
      return
    }
    const ctx: NotificationContext = context ?? {
      dailyTokens: 38_500_000,
      dailyLimit: 50_000_000,
      pctOfLimit: 77,
    }
    for (const rule of targets) {
      // Unique tag prevents the browser from deduplicating test notifications
      // against real ones that might already be showing.
      new Notification(rule.title, {
        body: rule.body(ctx),
        requireInteraction: true,
        tag: `${rule.id}:test:${Date.now()}`,
        icon: '/favicon.ico',
      })
    }
  }

  ruleIds(): string[] {
    return this.rules.map((r) => r.id)
  }

  addRule(rule: NotificationRule): this {
    this.rules = [...this.rules.filter((r) => r.id !== rule.id), rule]
    return this
  }

  removeRule(id: string): this {
    this.rules = this.rules.filter((r) => r.id !== id)
    return this
  }
}
