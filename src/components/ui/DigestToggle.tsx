'use client'

import { useState, useEffect } from 'react'
import { getDigestEnabled, setDigestEnabled } from '@/lib/notifications'
import styles from './RefreshButton.module.css'
import toggleStyles from './DigestToggle.module.css'

export function DigestToggle() {
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setEnabled(getDigestEnabled())
    setMounted(true)
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    setDigestEnabled(next)
  }

  // Render nothing until mounted to avoid SSR/hydration mismatch
  if (!mounted) return null

  return (
    <button
      className={`${styles.btn} ${enabled ? toggleStyles.active : ''}`}
      onClick={toggle}
      aria-label={enabled ? 'Disable daily digest notifications' : 'Enable daily digest notifications'}
      title={enabled ? 'Daily digest on — click to disable' : 'Daily digest off — click to enable'}
    >
      <span className={styles.icon} aria-hidden>{enabled ? '🔔' : '🔕'}</span>
      Digest
    </button>
  )
}
