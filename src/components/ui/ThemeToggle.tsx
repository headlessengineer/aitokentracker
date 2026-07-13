'use client'

import { useEffect, useState } from 'react'
import styles from './ThemeToggle.module.css'

const STORAGE_KEY = 'headlessengineer-theme'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(dark)
    document.body.classList.toggle('dark-mode', dark)
    setMounted(true)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.body.classList.toggle('dark-mode', next)
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
  }

  if (!mounted) return <div className={styles.placeholder} aria-hidden />

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="8" y1="1" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="13.5" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1" y1="8" x2="2.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13.5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3.1" y1="3.1" x2="4.16" y2="4.16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11.84" y1="11.84" x2="12.9" y2="12.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3.1" y1="12.9" x2="4.16" y2="11.84" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11.84" y1="4.16" x2="12.9" y2="3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M13.5 10.5a6 6 0 0 1-8-8 6 6 0 1 0 8 8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
