'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { MCPServerStats } from '@/plugins/core/types'
import styles from './BreakdownChart.module.css'

interface MCPChartProps {
  servers: MCPServerStats[]
}

function formatServer(name: string): string {
  return name
    .replace(/^mcp__/, '')
    .split('_')
    .filter((p) => !['claude', 'ai'].includes(p.toLowerCase()))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
    .trim() || name
}

export function MCPChart({ servers }: MCPChartProps) {
  const sorted = [...servers].sort((a, b) => b.callCount - a.callCount).slice(0, 8)
  const total = sorted.reduce((sum, s) => sum + s.callCount, 0)
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
        return `${item.name}<br/><strong>${item.value}</strong> calls (${item.percent.toFixed(1)}%)`
      },
    },
    legend: { show: false },
    series: [
      {
        type: 'pie' as const,
        radius: ['48%', '72%'],
        center: ['38%', '50%'],
        data: sorted.map((s, i) => ({
          name: formatServer(s.server),
          value: s.callCount,
          itemStyle: { color: palette[i % palette.length] },
        })),
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' } },
      },
    ],
  }), [sorted, theme, palette])

  if (sorted.length === 0) {
    return <p className={styles.empty}>No MCP tool calls found.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 200 }} />
      <div className={styles.legend}>
        {sorted.map((s, i) => (
          <div key={s.server} className={styles.row}>
            <span className={styles.swatch} style={{ background: palette[i % palette.length] }} />
            <span className={styles.label}>{formatServer(s.server)}</span>
            <span className={styles.value}>{s.callCount}</span>
            <span className={styles.pct}>
              {total > 0 ? `${Math.round((s.callCount / total) * 100)}%` : '—'}
            </span>
          </div>
        ))}
        {sorted.length > 0 && (
          <p className={styles.toolsNote}>
            {sorted.map((s) => s.tools.slice(0, 3).join(', ')).join(' · ')}
          </p>
        )}
      </div>
    </div>
  )
}
