'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { DailyActivity } from '@/plugins/core/types'
import styles from './ActivityHeatmap.module.css'

interface ActivityHeatmapProps {
  activity: DailyActivity[]
  year?: number
}

export function ActivityHeatmap({ activity, year }: ActivityHeatmapProps) {
  const targetYear = year ?? new Date().getFullYear()
  const theme = useChartTheme()

  const option = useMemo(() => {
    const useConversations = activity.every((d) => d.tokens === 0)
    const label = useConversations ? 'conversations' : 'tokens'
    const yearActivity = activity.filter((d) => d.date.startsWith(String(targetYear)))
    const data = yearActivity.map((d) => [d.date, useConversations ? d.conversations : d.tokens])
    const maxVal = Math.max(...yearActivity.map((d) => useConversations ? d.conversations : d.tokens), 1)

    return {
      tooltip: {
        formatter: (params: unknown) => {
          const p = params as { value: [string, number] }
          const [date, val] = p.value
          const k = val >= 1000 ? `${(val / 1000).toFixed(1)}K` : String(val)
          return `${date}<br/><strong>${k}</strong> ${label}`
        },
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxVal,
        inRange: { color: [theme.elevated, theme.primary] },
      },
      calendar: {
        top: 24,
        left: 40,
        right: 8,
        bottom: 8,
        cellSize: ['auto' as const, 14],
        range: String(targetYear),
        itemStyle: {
          borderColor: theme.bg,
          borderWidth: 2,
          borderRadius: 2,
          color: theme.elevated,
        },
        yearLabel: { show: false },
        monthLabel: {
          color: theme.fgMuted,
          fontSize: 11,
        },
        dayLabel: {
          firstDay: 1,
          color: theme.fgMuted,
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'heatmap' as const,
          coordinateSystem: 'calendar' as const,
          data,
        },
      ],
    }
  }, [activity, targetYear, theme])

  if (activity.length === 0) {
    return <p className={styles.empty}>No activity recorded for this period.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 160 }} />
    </div>
  )
}
