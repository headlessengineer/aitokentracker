'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { ToolCallStats, ToolCategory } from '@/plugins/core/types'
import styles from './TopToolsChart.module.css'

interface TopToolsChartProps {
  tools: ToolCallStats[]
}

const CATEGORY_COLOR: Record<ToolCategory, string> = {
  core:  '#4d4d4d',
  agent: '#009999',
  skill: '#808080',
  mcp:   '#b3b3b3',
  other: '#e0e0e0',
}

const CATEGORY_LABEL: Record<ToolCategory, string> = {
  core:  'Core',
  agent: 'Agent',
  skill: 'Skill',
  mcp:   'MCP',
  other: 'Other',
}

export function TopToolsChart({ tools }: TopToolsChartProps) {
  const sorted = [...tools].sort((a, b) => b.callCount - a.callCount).slice(0, 15)
  const theme = useChartTheme()

  const categoryColor = useMemo(
    () => ({ ...CATEGORY_COLOR, agent: theme.primary }),
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
        const tool = sorted[p.dataIndex]
        const cat = tool ? CATEGORY_LABEL[tool.category] : ''
        return `<strong>${p.name}</strong> <span style="color:${theme.fgMuted}">${cat}</span><br/>${p.value} calls`
      },
    },
    grid: { top: 8, right: 56, bottom: 8, left: 8, containLabel: true },
    xAxis: { show: false, type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((t) => t.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.fgSecondary,
        fontSize: 11,
        fontFamily: 'JetBrains Mono, monospace',
      },
    },
    series: [
      {
        type: 'bar' as const,
        data: sorted.map((t) => ({
          value: t.callCount,
          itemStyle: {
            color: categoryColor[t.category],
            borderRadius: [0, 4, 4, 0],
          },
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
  }), [sorted, theme, categoryColor])

  if (sorted.length === 0) {
    return <p className={styles.empty}>No tool usage data.</p>
  }

  return (
    <div className={styles.root}>
      <EChart option={option} style={{ width: '100%', height: Math.max(sorted.length * 32, 120) }} />
      <div className={styles.legend}>
        {(Object.entries(categoryColor) as Array<[ToolCategory, string]>).map(([cat, color]) => (
          <div key={cat} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: color }} />
            <span>{CATEGORY_LABEL[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
