'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { ModelStats } from '@/plugins/core/types'
import { formatTokens } from '@/lib/format'
import styles from './ModelChart.module.css'

interface ModelStackedChartProps {
  models: ModelStats[]
}

function shortModelName(model: string): string {
  return model
    .replace(/^claude-/, '')
    .replace(/-(\d)/, ' $1')
    .replace(/-(\d{4}\d*)$/, '')
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function ModelStackedChart({ models }: ModelStackedChartProps) {
  const sorted = [...models].sort((a, b) => b.tokens - a.tokens).slice(0, 8)
  const theme = useChartTheme()

  const COLORS = useMemo(() => ({
    input:      theme.primary,
    output:     theme.n600,
    cacheRead:  theme.fgMuted,
    cacheWrite: theme.n300,
  }), [theme.primary, theme.n600, theme.fgMuted, theme.n300])

  const names = sorted.map((m) => shortModelName(m.model))

  const series = useMemo(() => [
    {
      name: 'Input',
      type: 'bar' as const,
      stack: 'tokens',
      data: sorted.map((m) => m.tokensDetail.input),
      itemStyle: { color: COLORS.input },
    },
    {
      name: 'Output',
      type: 'bar' as const,
      stack: 'tokens',
      data: sorted.map((m) => m.tokensDetail.output),
      itemStyle: { color: COLORS.output },
    },
    {
      name: 'Cache Read',
      type: 'bar' as const,
      stack: 'tokens',
      data: sorted.map((m) => m.tokensDetail.cacheRead),
      itemStyle: { color: COLORS.cacheRead },
    },
    {
      name: 'Cache Write',
      type: 'bar' as const,
      stack: 'tokens',
      data: sorted.map((m) => m.tokensDetail.cacheWrite),
      itemStyle: { color: COLORS.cacheWrite, borderRadius: [0, 4, 4, 0] },
    },
  ], [sorted, COLORS])

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      backgroundColor: theme.surfaceCard,
      borderColor: theme.border,
      textStyle: { color: theme.fg, fontSize: 13 },
      formatter: (params: unknown) => {
        const list = params as Array<{ seriesName: string; value: number; dataIndex: number }>
        if (!list.length) return ''
        const model = sorted[list[0].dataIndex]
        const lines = [shortModelName(model.model), `<strong>${formatTokens(model.tokens)}</strong> total · ${model.conversations} conv`]
        for (const p of list) {
          if (p.value > 0) lines.push(`${p.seriesName}: ${formatTokens(p.value)}`)
        }
        return lines.join('<br/>')
      },
    },
    legend: {
      data: ['Input', 'Output', 'Cache Read', 'Cache Write'],
      bottom: 0,
      textStyle: { color: theme.fgSecondary, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { top: 8, right: 16, bottom: 40, left: 8, containLabel: true },
    xAxis: { show: false, type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.fgSecondary, fontSize: 12 },
      splitLine: { show: false },
    },
    series,
  }), [sorted, names, series, theme])

  if (sorted.length === 0) {
    return <p className={styles.empty}>No model data available.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: Math.max(sorted.length * 44 + 48, 160) }} />
}
