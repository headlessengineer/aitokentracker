'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { DailyCost } from '@/plugins/core/types'
import styles from './BreakdownChart.module.css'

interface CostTimelineProps {
  dailyCost: DailyCost[]
  days?: number
  dailyCostWithoutCache?: DailyCost[]
}

export function CostTimeline({ dailyCost, days = 30, dailyCostWithoutCache }: CostTimelineProps) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    const sorted = [...dailyCost].sort((a, b) => a.date.localeCompare(b.date)).slice(-days)
    const dates = sorted.map((d) => d.date)

    // Build a lookup for the without-cache line (aligned to same date set)
    const withoutCacheMap = new Map(
      (dailyCostWithoutCache ?? []).map((d) => [d.date, d.costUSD])
    )
    const hasWithoutCache = (dailyCostWithoutCache?.length ?? 0) > 0 &&
      sorted.some((d) => (withoutCacheMap.get(d.date) ?? 0) > d.costUSD)

    const series: Record<string, unknown>[] = [
      {
        type: 'bar' as const,
        name: 'Actual cost',
        data: sorted.map((d) => d.costUSD),
        itemStyle: { color: theme.primary, borderRadius: [3, 3, 0, 0] },
        emphasis: { itemStyle: { color: theme.n400 } },
      },
    ]

    if (hasWithoutCache) {
      series.push({
        type: 'line' as const,
        name: 'Without cache',
        data: dates.map((d) => withoutCacheMap.get(d) ?? sorted.find((s) => s.date === d)?.costUSD ?? 0),
        lineStyle: { color: theme.n400, type: 'dashed', width: 1.5 },
        itemStyle: { color: theme.n400 },
        symbol: 'none',
        z: 2,
      })
    }

    return {
      grid: { top: hasWithoutCache ? 32 : 16, right: 16, bottom: 32, left: 64, containLabel: false },
      legend: hasWithoutCache ? {
        top: 4,
        right: 0,
        data: ['Actual cost', 'Without cache'],
        textStyle: { color: theme.fgSecondary, fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
      } : undefined,
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number; seriesName: string }>
          const date = list[0]?.axisValue ?? ''
          if (!hasWithoutCache) {
            return `${date}<br/><strong>$${(list[0]?.value ?? 0).toFixed(4)}</strong>`
          }
          const actual = list.find((p) => p.seriesName === 'Actual cost')?.value ?? 0
          const without = list.find((p) => p.seriesName === 'Without cache')?.value ?? actual
          const saved = without - actual
          return [
            date,
            `Actual: <strong>$${actual.toFixed(4)}</strong>`,
            `Without cache: $${without.toFixed(4)}`,
            saved > 0 ? `<span style="color:${theme.primary}">Saved: $${saved.toFixed(4)}</span>` : '',
          ].filter(Boolean).join('<br/>')
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
      series,
    }
  }, [dailyCost, dailyCostWithoutCache, days, theme])

  if (dailyCost.length === 0) {
    return <p className={styles.empty}>No cost data available.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: 200 }} />
}
