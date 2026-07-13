'use client'

import { useRef, useEffect, useCallback } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CalendarComponent,
  VisualMapComponent,
  TitleComponent,
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CalendarComponent,
  VisualMapComponent,
  TitleComponent,
  SVGRenderer,
])

export type { EChartsOption }

interface EChartProps {
  option: EChartsOption
  style?: React.CSSProperties
  className?: string
}

export function EChart({ option, style, className }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  const getOrInitChart = useCallback(() => {
    if (!containerRef.current) return null
    if (!chartRef.current || chartRef.current.isDisposed()) {
      chartRef.current = echarts.init(containerRef.current, null, { renderer: 'svg' })
    }
    return chartRef.current
  }, [])

  useEffect(() => {
    const chart = getOrInitChart()
    if (!chart) return
    chart.setOption(option, { notMerge: true })
  }, [option, getOrInitChart])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      chartRef.current?.resize()
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
      chartRef.current?.dispose()
      chartRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      role="img"
      aria-label="Chart"
    />
  )
}
