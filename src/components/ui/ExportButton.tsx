'use client'

import styles from './RefreshButton.module.css'

interface Props {
  days: number
  pluginId?: string
}

export function ExportButton({ days, pluginId }: Props) {
  const params = new URLSearchParams({ days: String(days), format: 'csv' })
  if (pluginId) params.set('plugins', pluginId)

  return (
    <a
      href={`/api/export?${params.toString()}`}
      download
      className={styles.btn}
      aria-label="Export usage data as CSV"
    >
      <span className={styles.icon} aria-hidden>↓</span>
      Export CSV
    </a>
  )
}
