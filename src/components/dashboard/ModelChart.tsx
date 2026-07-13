'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { ModelStats } from '@/plugins/core/types'
import { formatTokens } from '@/lib/format'
import styles from './ModelChart.module.css'

interface ModelChartProps {
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

export function ModelChart({ models }: ModelChartProps) {
  const sorted = [...models].sort((a, b) => b.tokens - a.tokens).slice(0, 8)
  const theme = useChartTheme()

  const modelColors = useMemo(
    () => [theme.primary, '#4d4d4d', '#808080', '#b3b3b3', '#e0e0e0'],
    [theme.primary]
  )

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      backgroundColor: theme.surfaceCard,
      borderColor: theme.border,
      textStyle: { color: theme.fg, fontSize: 13 },
      formatter: (params: unknown) => {
        const list = params as Array<{ name: string; value: number; dataIndex: number }>
        const p = list[0]
        const model = sorted[p.dataIndex]
        return `${shortModelName(p.name)}<br/><strong>${formatTokens(p.value)}</strong> tokens · ${model?.conversations ?? 0} conv.`
      },
    },
    grid: { top: 8, right: 24, bottom: 8, left: 8, containLabel: true },
    xAxis: { show: false, type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((m) => shortModelName(m.model)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.fgSecondary, fontSize: 12 },
      splitLine: { show: false },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted.map((m, i) => ({
          value: m.tokens,
          itemStyle: { color: modelColors[i % modelColors.length], borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right' as const,
          formatter: (p: unknown) => formatTokens((p as { value: number }).value),
          color: theme.fgSecondary,
          fontSize: 11,
        },
      },
    ],
  }), [sorted, theme, modelColors])

  if (sorted.length === 0) {
    return <p className={styles.empty}>No model data available.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: Math.max(sorted.length * 40, 120) }} />
}
