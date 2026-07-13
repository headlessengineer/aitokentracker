'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import styles from './TimeRangeFilter.module.css'

const RANGES: Array<{ label: string; days: number }> = [
  { label: '1D',  days: 1  },
  { label: '7D',  days: 7  },
  { label: '15D', days: 15 },
  { label: '30D', days: 30 },
  { label: '60D', days: 60 },
  { label: '90D', days: 90 },
]

interface TimeRangeFilterProps {
  selectedDays: number
}

export function TimeRangeFilter({ selectedDays }: TimeRangeFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function select(days: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('days', String(days))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className={styles.root} role="group" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r.days}
          className={`${styles.btn} ${selectedDays === r.days ? styles.active : ''}`}
          onClick={() => select(r.days)}
          aria-pressed={selectedDays === r.days}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
