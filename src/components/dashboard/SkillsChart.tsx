'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { SkillStats } from '@/plugins/core/types'
import styles from './BreakdownChart.module.css'

interface SkillsChartProps {
  skills: SkillStats[]
}

export function SkillsChart({ skills }: SkillsChartProps) {
  const sorted = [...skills].sort((a, b) => b.invocations - a.invocations).slice(0, 8)
  const total = sorted.reduce((sum, s) => sum + s.invocations, 0)
  const theme = useChartTheme()

  const palette = useMemo(
    () => [theme.primary, theme.n600, theme.fgMuted, theme.n300, theme.n200, theme.n700],
    [theme.primary, theme.n600, theme.fgMuted, theme.n300, theme.n200, theme.n700]
  )

  const option = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: { type: 'none' as const },
      backgroundColor: theme.surfaceCard,
      borderColor: theme.border,
      textStyle: { color: theme.fg, fontSize: 13 },
    },
    grid: { top: 8, right: 56, bottom: 8, left: 8, containLabel: true },
    xAxis: { show: false, type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((s) => s.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: theme.fgSecondary, fontSize: 11 },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted.map((s, i) => ({
          value: s.invocations,
          itemStyle: { color: palette[i % palette.length], borderRadius: [0, 4, 4, 0] },
        })),
        label: {
          show: true,
          position: 'right' as const,
          formatter: (p: unknown) => String((p as { value: number }).value),
          color: theme.fgSecondary,
          fontSize: 11,
        },
      },
    ],
  }), [sorted, theme, palette])

  if (sorted.length === 0) {
    return <p className={styles.empty}>No skill invocations found.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: Math.max(sorted.length * 36, 100) }} />
      <div className={styles.legend}>
        {sorted.map((s, i) => (
          <div key={s.name} className={styles.row}>
            <span className={styles.swatch} style={{ background: palette[i % palette.length] }} />
            <span className={styles.label}>{s.name}</span>
            <span className={styles.value}>{s.invocations}×</span>
            <span className={styles.pct}>
              {total > 0 ? `${Math.round((s.invocations / total) * 100)}%` : '—'} · {s.conversations}c
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
