'use client'

import { useRouter } from 'next/navigation'
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
  activePluginId?: string
  selectedDays: number
  dataPath?: string
  action?: React.ReactNode
}

export function ControlBar({ activePluginId, selectedDays, dataPath, action }: ControlBarProps) {
  const router = useRouter()

  function onDaysChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const path = activePluginId ? `/${activePluginId}` : '/'
    router.push(`${path}?days=${e.target.value}`)
  }

  return (
    <div className={styles.root}>
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
      {(action || dataPath) && (
        <div className={styles.right}>
          {action}
          {dataPath && (
            <span className={styles.dataPath} title={dataPath}>
              {dataPath}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
