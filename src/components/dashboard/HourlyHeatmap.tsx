'use client'

import { useMemo } from 'react'
import { EChart } from '@/components/charts/EChart'
import { useChartTheme } from '@/lib/useChartTheme'
import type { HourlyActivity } from '@/plugins/core/types'
import { formatTokens } from '@/lib/format'
import styles from './BreakdownChart.module.css'

interface Props {
  activity: HourlyActivity[]
}

// Mon-first ordering: getDay() returns 0=Sun…6=Sat; map to Mon(0)…Sun(6)
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DOW_TO_IDX: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 }

const HOUR_LABELS = [
  '12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a',
  '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p',
]

export function HourlyHeatmap({ activity }: Props) {
  const theme = useChartTheme()

  const option = useMemo(() => {
    // Build a dense 24×7 grid — sparse input, zero for missing cells
    const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
    for (const { hour, dayOfWeek, tokens } of activity) {
      const di = DOW_TO_IDX[dayOfWeek]
      if (di !== undefined && hour >= 0 && hour < 24) {
        grid[di][hour] += tokens
      }
    }

    const data: [number, number, number][] = []
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        data.push([h, d, grid[d][h]])
      }
    }

    const maxVal = Math.max(...data.map((r) => r[2]), 1)

    return {
      grid: { top: 8, right: 16, bottom: 40, left: 40, containLabel: false },
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: theme.surfaceCard,
        borderColor: theme.border,
        textStyle: { color: theme.fg, fontSize: 13 },
        formatter: (params: unknown) => {
          const p = params as { value: [number, number, number] }
          const [h, d, val] = p.value
          if (val === 0) return `${DAY_LABELS[d]} ${HOUR_LABELS[h]}<br/>No activity`
          return `${DAY_LABELS[d]} ${HOUR_LABELS[h]}<br/><strong>${formatTokens(val)}</strong> tokens`
        },
      },
      visualMap: {
        show: false,
        min: 0,
        max: maxVal,
        inRange: { color: [theme.elevated, theme.primary] },
      },
      xAxis: {
        type: 'category' as const,
        data: HOUR_LABELS,
        splitArea: { show: true, areaStyle: { color: ['transparent', 'transparent'] } },
        axisLabel: { color: theme.fgMuted, fontSize: 10, interval: 2 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: DAY_LABELS,
        splitArea: { show: true, areaStyle: { color: ['transparent', 'transparent'] } },
        axisLabel: { color: theme.fgMuted, fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'heatmap' as const,
          data,
          itemStyle: { borderRadius: 2, borderWidth: 2, borderColor: theme.bg },
          emphasis: { itemStyle: { shadowBlur: 6, shadowColor: theme.primary } },
        },
      ],
    }
  }, [activity, theme])

  if (activity.length === 0) {
    return <p className={styles.empty}>No hourly activity data for this period.</p>
  }

  return <EChart option={option} style={{ width: '100%', height: 180 }} />
}
