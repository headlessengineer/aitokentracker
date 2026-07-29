'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { DailyCost } from '@/plugins/core/types'
import styles from './BreakdownChart.module.css'

interface CostTimelineProps {
  dailyCost: DailyCost[]
  days?: number
}

export function CostTimeline({ dailyCost, days = 30 }: CostTimelineProps) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    const sorted = [...dailyCost].sort((a, b) => a.date.localeCompare(b.date)).slice(-days)

    return {
      grid: { top: 16, right: 16, bottom: 32, left: 64, containLabel: false },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number }>
          const p = list[0]
          return `${p.axisValue}<br/><strong>$${p.value.toFixed(4)}</strong>`
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
          formatter: (v: number) => `$${v < 1 ? v.toFixed(2) : v.toFixed(0)}`,
        },
        splitLine: { lineStyle: { color: theme.border, type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar' as const,
          data: sorted.map((d) => d.costUSD),
          itemStyle: { color: theme.primary, borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: theme.n400 } },
        },
      ],
    }
  }, [dailyCost, days, theme])

  if (dailyCost.length === 0) {
    return <p className={styles.empty}>No cost data available.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: 200 }} />
}
