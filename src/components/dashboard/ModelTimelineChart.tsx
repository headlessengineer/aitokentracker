'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import { formatTokens } from '@/lib/format'
import styles from './ModelChart.module.css'

interface ModelDayEntry {
  date: string
  model: string
  tokens: number
}

interface Props {
  data: ModelDayEntry[]
  days: number
}

const PALETTE = [
  '#008383', '#005959', '#4da6a6', '#003636', '#80c2c2',
  '#001e1e', '#a6d1d1', '#616161', '#989898', '#b6b6b6',
]

function shortModelName(model: string): string {
  return model
    .replace(/^claude-/, '')
    .replace(/-(\d)/, ' $1')
    .replace(/-(\d{4}\d*)$/, '')
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function dateKeys(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1) + i)
    return d.toISOString().split('T')[0]
  })
}

export function ModelTimelineChart({ data, days }: Props) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    const dates = dateKeys(days)

    // Rank models by total tokens, cap at 10
    const modelTotals = new Map<string, number>()
    for (const { model, tokens } of data) {
      modelTotals.set(model, (modelTotals.get(model) ?? 0) + tokens)
    }
    const models = [...modelTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([m]) => m)

    if (models.length === 0) return {}

    // Sparse data → dense lookup
    const modelDayLookup = new Map<string, number>()
    for (const { date, model, tokens } of data) {
      const k = `${model}:${date}`
      modelDayLookup.set(k, (modelDayLookup.get(k) ?? 0) + tokens)
    }

    const series = models.map((model, idx) => ({
      name: shortModelName(model),
      type: 'line' as const,
      stack: 'total',
      areaStyle: { opacity: 0.75 },
      smooth: false,
      symbol: 'none',
      data: dates.map((d) => modelDayLookup.get(`${model}:${d}`) ?? 0),
      itemStyle: { color: PALETTE[idx % PALETTE.length] },
      lineStyle: { color: PALETTE[idx % PALETTE.length], width: 1 },
      emphasis: { focus: 'series' as const },
    }))

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
        data: models.map(shortModelName),
        textStyle: { color: theme.fgSecondary, fontSize: 10 },
        itemWidth: 10,
        itemHeight: 10,
        pageTextStyle: { color: theme.fgMuted },
      },
      xAxis: {
        type: 'category' as const,
        data: dates.map((d) => d.slice(5)),
        boundaryGap: false,
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
      series,
    }
  }, [data, days, theme])

  if (data.length === 0) {
    return <p className={styles.empty}>No model timeline data available.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: 240 }} />
}
