'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { DailyActivity } from '@/plugins/core/types'
import { formatTokens } from '@/lib/format'
import styles from './TimelineChart.module.css'

interface TimelineChartProps {
  activity: DailyActivity[]
  days?: number
}

export function TimelineChart({ activity, days = 30 }: TimelineChartProps) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    const sorted = [...activity].sort((a, b) => a.date.localeCompare(b.date)).slice(-days)
    const useConversations = sorted.every((d) => d.tokens === 0)

    const xAxis = {
      type: 'category' as const,
      data: sorted.map((d) => d.date.slice(5)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.fgMuted, fontSize: 11, interval: Math.floor(sorted.length / 6) },
      splitLine: { show: false },
    }

    if (useConversations) {
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
            return `${p.axisValue}<br/><strong>${p.value}</strong> conversations`
          },
        },
        xAxis,
        yAxis: {
          type: 'value' as const,
          minInterval: 1,
          axisLabel: { color: theme.fgMuted, fontSize: 11 },
          splitLine: { lineStyle: { color: theme.border, type: 'dashed' as const } },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [{
          type: 'bar' as const,
          data: sorted.map((d) => d.conversations),
          itemStyle: { color: theme.primary, borderRadius: [3, 3, 0, 0] },
        }],
      }
    }

    const COLORS = {
      input:      theme.primary,
      output:     theme.n600,
      cacheRead:  theme.fgMuted,
      cacheWrite: theme.n300,
    }

    return {
      grid: { top: 40, right: 16, bottom: 32, left: 56, containLabel: false },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number; seriesName: string; color: string }>
          const date = list[0]?.axisValue ?? ''
          const total = list.reduce((s, p) => s + p.value, 0)
          const lines = [`${date} · <strong>${formatTokens(total)}</strong>`]
          for (const p of list) {
            if (p.value > 0) {
              lines.push(`<span style="color:${p.color}">●</span> ${p.seriesName}: ${formatTokens(p.value)}`)
            }
          }
          return lines.join('<br/>')
        },
      },
      legend: {
        top: 4,
        right: 0,
        data: ['Input', 'Output', 'Cache Read', 'Cache Write'],
        textStyle: { color: theme.fgSecondary, fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
      },
      xAxis,
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
          name: 'Input',
          type: 'bar' as const,
          stack: 'tokens',
          data: sorted.map((d) => d.input),
          itemStyle: { color: COLORS.input },
        },
        {
          name: 'Output',
          type: 'bar' as const,
          stack: 'tokens',
          data: sorted.map((d) => d.output),
          itemStyle: { color: COLORS.output },
        },
        {
          name: 'Cache Read',
          type: 'bar' as const,
          stack: 'tokens',
          data: sorted.map((d) => d.cacheRead),
          itemStyle: { color: COLORS.cacheRead },
        },
        {
          name: 'Cache Write',
          type: 'bar' as const,
          stack: 'tokens',
          data: sorted.map((d) => d.cacheWrite),
          itemStyle: { color: COLORS.cacheWrite, borderRadius: [3, 3, 0, 0] },
        },
      ],
    }
  }, [activity, days, theme])

  if (activity.length === 0) {
    return <p className={styles.empty}>No data for this period — try a wider date range.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 220 }} />
    </div>
  )
}
