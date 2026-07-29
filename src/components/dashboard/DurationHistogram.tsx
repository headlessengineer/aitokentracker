'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import styles from './BreakdownChart.module.css'

export interface DurationBucket {
  label: string
  count: number
}

interface DurationHistogramProps {
  buckets: DurationBucket[]
}

export function DurationHistogram({ buckets }: DurationHistogramProps) {
  const theme = useChartTheme()
  const total = buckets.reduce((s, b) => s + b.count, 0)

  const option = useMemo(() => ({
    grid: { top: 16, right: 56, bottom: 32, left: 16, containLabel: true },
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: theme.surfaceCard,
      borderColor: theme.border,
      textStyle: { color: theme.fg, fontSize: 13 },
      formatter: (params: unknown) => {
        const list = params as Array<{ name: string; value: number }>
        const p = list[0]
        const pct = total > 0 ? Math.round((p.value / total) * 100) : 0
        return `${p.name}<br/><strong>${p.value}</strong> sessions (${pct}%)`
      },
    },
    xAxis: {
      type: 'category' as const,
      data: buckets.map((b) => b.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.fgSecondary, fontSize: 12 },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      minInterval: 1,
      axisLabel: { color: theme.fgMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.border, type: 'dashed' as const } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar' as const,
        data: buckets.map((b, i) => ({
          value: b.count,
          itemStyle: {
            color: i === 0 ? theme.primary : theme.fgMuted,
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: {
          show: true,
          position: 'top' as const,
          formatter: (p: unknown) => {
            const v = (p as { value: number }).value
            return v > 0 ? String(v) : ''
          },
          color: theme.fgSecondary,
          fontSize: 11,
        },
      },
    ],
  }), [buckets, theme, total])

  if (total === 0) {
    return <p className={styles.empty}>No conversation data available.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: 200 }} />
}
