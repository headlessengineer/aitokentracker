'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { DailyActivity } from '@/plugins/core/types'
import styles from './TimelineChart.module.css'

interface TimelineChartProps {
  activity: DailyActivity[]
  days?: number
}

export function TimelineChart({ activity, days = 30 }: TimelineChartProps) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    const sorted = [...activity].sort((a, b) => a.date.localeCompare(b.date)).slice(-days)

    return {
      grid: { top: 16, right: 16, bottom: 32, left: 56, containLabel: false },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number }>
          const p = list[0]
          const k = p.value >= 1000 ? `${(p.value / 1000).toFixed(1)}K` : String(p.value)
          return `${p.axisValue}<br/><strong>${k}</strong> tokens`
        },
      },
      xAxis: {
        type: 'category' as const,
        data: sorted.map((d) => d.date.slice(5)),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: theme.fgMuted,
          fontSize: 11,
          interval: Math.floor(sorted.length / 6),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: theme.fgMuted,
          fontSize: 11,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v),
        },
        splitLine: { lineStyle: { color: theme.border, type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: sorted.map((d) => d.tokens),
          itemStyle: {
            color: theme.primary,
            borderRadius: [3, 3, 0, 0],
          },
          emphasis: {
            itemStyle: { color: '#00b3b3' },
          },
        },
      ],
    }
  }, [activity, days, theme])

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 200 }} />
    </div>
  )
}
