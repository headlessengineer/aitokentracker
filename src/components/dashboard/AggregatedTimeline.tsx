'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { PluginActivitySeries } from '@/app/page'
import { formatTokens } from '@/lib/format'
import styles from './BreakdownChart.module.css'

interface Props {
  series: PluginActivitySeries[]
  days: number
}

// Monochromatic teal palette that stays within the one-hue design system.
// Alternates tints/shades so adjacent tools remain distinguishable.
const PALETTE = [
  '#008383', // primary
  '#005959', // shade 1
  '#4da6a6', // tint 1
  '#003636', // shade 2
  '#80c2c2', // tint 2
  '#001e1e', // shade 3
  '#a6d1d1', // tint 3
  '#616161', // neutral 1 (overflow)
  '#989898', // neutral 2
  '#b6b6b6', // neutral 3
]

/** Fill a sparse DailyActivity array into a dense date-keyed map. */
function activityMap(activity: PluginActivitySeries['activity']): Map<string, number> {
  return new Map(activity.map((d) => [d.date, d.tokens]))
}

/** Generate the YYYY-MM-DD keys for the trailing `days` window (inclusive today). */
function dateKeys(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1) + i)
    return d.toISOString().split('T')[0]
  })
}

export function AggregatedTimeline({ series, days }: Props) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    // Cap at 10 series for readability; the rest are already excluded upstream
    // since only plugins with token data are included.
    const visible = series.slice(0, 10)
    const dates = dateKeys(days)
    const xLabels = dates.map((d) => d.slice(5)) // MM-DD

    const echartsSeriesData = visible.map((s, idx) => {
      const map = activityMap(s.activity)
      return {
        name: s.name,
        type: 'bar' as const,
        stack: 'total',
        data: dates.map((k) => map.get(k) ?? 0),
        itemStyle: {
          color: PALETTE[idx % PALETTE.length],
          // Only the top-most series (last in stack) gets rounded top corners.
          // ECharts applies borderRadius per-bar so we set it on the last series.
          ...(idx === visible.length - 1 ? { borderRadius: [3, 3, 0, 0] } : {}),
        },
        emphasis: { focus: 'series' as const },
      }
    })

    return {
      grid: { top: 40, right: 16, bottom: 32, left: 56, containLabel: false },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
        formatter: (params: unknown) => {
          const list = params as Array<{
            axisValue: string
            value: number
            seriesName: string
            color: string
          }>
          const date = list[0]?.axisValue ?? ''
          const total = list.reduce((s, p) => s + p.value, 0)
          if (total === 0) return `${date}<br/>No activity`
          const lines = [`${date} · <strong>${formatTokens(total)}</strong>`]
          for (const p of [...list].reverse()) {
            if (p.value > 0) {
              lines.push(
                `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:4px;vertical-align:middle;"></span>${p.seriesName}: ${formatTokens(p.value)}`,
              )
            }
          }
          return lines.join('<br/>')
        },
      },
      legend: {
        top: 4,
        right: 0,
        type: 'scroll' as const,
        data: visible.map((s) => s.name),
        textStyle: { color: theme.fgSecondary, fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
        pageTextStyle: { color: theme.fgMuted },
      },
      xAxis: {
        type: 'category' as const,
        data: xLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: theme.fgMuted,
          fontSize: 11,
          interval: Math.floor(dates.length / 6),
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: theme.fgMuted,
          fontSize: 11,
          formatter: (v: number) =>
            v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` :
            v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v),
        },
        splitLine: { lineStyle: { color: theme.border, type: 'dashed' as const } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: echartsSeriesData,
    }
  }, [series, days, theme])

  if (series.length === 0) {
    return <p className={styles.empty}>No data for this period — try a wider date range.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: 240 }} />
}
