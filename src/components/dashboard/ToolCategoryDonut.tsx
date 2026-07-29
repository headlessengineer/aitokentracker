'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { ToolCallStats, ToolCategory } from '@/plugins/core/types'
import styles from './BreakdownChart.module.css'

interface ToolCategoryDonutProps {
  tools: ToolCallStats[]
}

const CATEGORY_LABEL: Record<ToolCategory, string> = {
  core:  'Core',
  agent: 'Agent',
  skill: 'Skill',
  mcp:   'MCP',
  other: 'Other',
}

const CATEGORY_ORDER: ToolCategory[] = ['agent', 'core', 'mcp', 'skill', 'other']

export function ToolCategoryDonut({ tools }: ToolCategoryDonutProps) {
  const theme = useChartTheme()

  const palette = useMemo(
    () => [theme.primary, theme.n600, theme.fgMuted, theme.n300, theme.n200],
    [theme.primary, theme.n600, theme.fgMuted, theme.n300, theme.n200]
  )

  const buckets = useMemo(() => {
    const totals: Partial<Record<ToolCategory, number>> = {}
    for (const t of tools) {
      totals[t.category] = (totals[t.category] ?? 0) + t.callCount
    }
    return CATEGORY_ORDER
      .filter((cat) => (totals[cat] ?? 0) > 0)
      .map((cat) => ({ cat, label: CATEGORY_LABEL[cat], count: totals[cat] ?? 0 }))
  }, [tools])

  const total = buckets.reduce((s, b) => s + b.count, 0)

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
        data: buckets.map((b, i) => ({
          name: b.label,
          value: b.count,
          itemStyle: { color: palette[i % palette.length] },
        })),
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' } },
      },
    ],
  }), [buckets, theme, palette])

  if (buckets.length === 0) {
    return <p className={styles.empty}>No tool usage data.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: 200 }} />
      <div className={styles.legend}>
        {buckets.map((b, i) => (
          <div key={b.cat} className={styles.row}>
            <span className={styles.swatch} style={{ background: palette[i % palette.length] }} />
            <span className={styles.label}>{b.label}</span>
            <span className={styles.value}>{b.count}</span>
            <span className={styles.pct}>
              {total > 0 ? `${Math.round((b.count / total) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
