'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import styles from './RefreshButton.module.css'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <button
      className={`${styles.btn} ${isPending ? styles.pending : ''}`}
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      aria-label="Refresh dashboard data"
    >
      <span className={styles.icon} aria-hidden>↻</span>
      {isPending ? 'Refreshing…' : 'Refresh data'}
    </button>
  )
}
