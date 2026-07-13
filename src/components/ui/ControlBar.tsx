'use client'

import { useRouter } from 'next/navigation'
import type { PluginStatus } from '@/plugins/core/types'
import styles from './ControlBar.module.css'

const RANGES: Array<{ label: string; days: number }> = [
  { label: 'Last 1 day',   days: 1  },
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 15 days', days: 15 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 60 days', days: 60 },
  { label: 'Last 90 days', days: 90 },
]

interface ControlBarProps {
  plugins: PluginStatus[]
  activePluginId?: string
  selectedDays: number
}

export function ControlBar({ plugins, activePluginId, selectedDays }: ControlBarProps) {
  const router = useRouter()

  function onToolChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const path = val === '__overview__' ? '/' : `/${val}`
    router.push(`${path}?days=${selectedDays}`)
  }

  function onDaysChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const path = activePluginId ? `/${activePluginId}` : '/'
    router.push(`${path}?days=${e.target.value}`)
  }

  return (
    <div className={styles.root}>
      <div className={styles.selectWrap}>
        <select
          className={styles.select}
          value={activePluginId ?? '__overview__'}
          onChange={onToolChange}
          aria-label="Select view"
        >
          <option value="__overview__">▦  Overview</option>
          {plugins.map((p) => (
            <option key={p.id} value={p.id} disabled={!p.available}>
              {p.icon}  {p.name}{!p.available ? '  —  not configured' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.selectWrap}>
        <select
          className={styles.select}
          value={String(selectedDays)}
          onChange={onDaysChange}
          aria-label="Select time range"
        >
          {RANGES.map((r) => (
            <option key={r.days} value={String(r.days)}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
