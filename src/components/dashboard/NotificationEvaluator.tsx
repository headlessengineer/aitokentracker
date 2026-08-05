'use client'

import { useEffect, useMemo } from 'react'
import { useNotifications, NotificationManager, DAILY_TOKEN_LIMIT } from '@/lib/notifications'
import type { NotificationContext } from '@/lib/notifications'
import type { ProviderLimit } from '@/lib/limits'

interface Props {
  todayTokens: number
  providerLimits?: ProviderLimit[]
  yesterdayTokens?: number
  yesterdayCostUSD?: number
  topToolNameYesterday?: string
}

export function NotificationEvaluator({
  todayTokens,
  providerLimits,
  yesterdayTokens,
  yesterdayCostUSD,
  topToolNameYesterday,
}: Props) {
  const context = useMemo<NotificationContext>(
    () => ({
      dailyTokens: todayTokens,
      dailyLimit: DAILY_TOKEN_LIMIT,
      pctOfLimit: (todayTokens / DAILY_TOKEN_LIMIT) * 100,
      providerLimits,
      yesterdayTokens,
      yesterdayCostUSD,
      topToolNameYesterday,
    }),
    [todayTokens, providerLimits, yesterdayTokens, yesterdayCostUSD, topToolNameYesterday]
  )

  useNotifications(context)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const mgr = new NotificationManager()
    ;(window as unknown as Record<string, unknown>).__aitokentracker = {
      testNotification: (ruleId?: string, ctx?: NotificationContext) => mgr.test(ruleId, ctx),
      listRules: () => console.log('[aitokentracker] rules:', mgr.ruleIds()),
    }
  }, [])

  return null
}
