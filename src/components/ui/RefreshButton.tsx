'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import styles from './RefreshButton.module.css'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRefresh() {
    startTransition(async () => {
      // Clear the server-side plugin cache so the next render re-reads from disk
      await fetch('/api/cache/clear', { method: 'POST' }).catch(() => undefined)
      router.refresh()
    })
  }

  return (
    <button
      className={`${styles.btn} ${isPending ? styles.pending : ''}`}
      onClick={handleRefresh}
      disabled={isPending}
      aria-label="Refresh dashboard data"
    >
      <span className={styles.icon} aria-hidden>↻</span>
      {isPending ? 'Refreshing…' : 'Refresh data'}
    </button>
  )
}
