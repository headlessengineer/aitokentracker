'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { TokenUsage } from '@/plugins/core/types'
import { formatTokens } from '@/lib/format'
import styles from './TokenBreakdown.module.css'

interface TokenBreakdownProps {
  tokens: TokenUsage
}

export function TokenBreakdown({ tokens }: TokenBreakdownProps) {
  const theme = useChartTheme()

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: theme.surfaceCard,
      borderColor: theme.border,
      textStyle: { color: theme.fg, fontSize: 13 },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie' as const,
        radius: ['55%', '78%'],
        center: ['50%', '50%'],
        data: [
          { name: 'Input',       value: tokens.input,      itemStyle: { color: theme.primary } },
          { name: 'Output',      value: tokens.output,     itemStyle: { color: theme.n600 } },
          { name: 'Cache read',  value: tokens.cacheRead,  itemStyle: { color: theme.n300 } },
          { name: 'Cache write', value: tokens.cacheWrite, itemStyle: { color: theme.n200 } },
        ].filter((d) => d.value > 0),
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.2)' },
        },
      },
    ],
  }), [tokens, theme])

  const rows: Array<{ label: string; value: number; color: string }> = [
    { label: 'Input',       value: tokens.input,      color: theme.primary },
    { label: 'Output',      value: tokens.output,     color: theme.n600 },
    { label: 'Cache read',  value: tokens.cacheRead,  color: theme.n300 },
    { label: 'Cache write', value: tokens.cacheWrite, color: theme.n200 },
  ]

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 200 }} />
      <div className={styles.legend}>
        {rows.filter((r) => r.value > 0).map((row) => (
          <div key={row.label} className={styles.legendRow}>
            <span className={styles.swatch} style={{ background: row.color }} />
            <span className={styles.legendLabel}>{row.label}</span>
            <span className={styles.legendValue}>{formatTokens(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
