'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { SubAgentStats } from '@/plugins/core/types'
import styles from './BreakdownChart.module.css'

interface SubAgentChartProps {
  subAgents: SubAgentStats[]
}

function formatType(t: string): string {
  return t
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export function SubAgentChart({ subAgents }: SubAgentChartProps) {
  const sorted = [...subAgents].sort((a, b) => b.invocations - a.invocations).slice(0, 6)
  const total = sorted.reduce((sum, s) => sum + s.invocations, 0)
  const theme = useChartTheme()

  const palette = useMemo(
    () => [theme.primary, '#4d4d4d', '#808080', '#b3b3b3', '#e0e0e0', '#2e2e2e'],
    [theme.primary]
  )

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: theme.surfaceCard,
      borderColor: theme.border,
      textStyle: { color: theme.fg, fontSize: 13 },
      formatter: (p: unknown) => {
        const item = p as { name: string; value: number; percent: number }
        return `${item.name}<br/><strong>${item.value}</strong> invocations (${item.percent.toFixed(1)}%)`
      },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie' as const,
        radius: ['48%', '72%'],
        center: ['38%', '50%'],
        data: sorted.map((s, i) => ({
          name: formatType(s.type),
          value: s.invocations,
          itemStyle: { color: palette[i % palette.length] },
        })),
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' } },
      },
    ],
  }), [sorted, theme, palette])

  if (sorted.length === 0) {
    return <p className={styles.empty}>No sub-agent invocations found.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 200 }} />
      <div className={styles.legend}>
        {sorted.map((s, i) => (
          <div key={s.type} className={styles.row}>
            <span className={styles.swatch} style={{ background: palette[i % palette.length] }} />
            <span className={styles.label}>{formatType(s.type)}</span>
            <span className={styles.value}>{s.invocations}</span>
            <span className={styles.pct}>
              {total > 0 ? `${Math.round((s.invocations / total) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
