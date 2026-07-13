'use client'

import { useState, useEffect } from 'react'

export interface ChartTheme {
  fg: string
  fgSecondary: string
  fgMuted: string
  bg: string
  surfaceCard: string
  elevated: string
  border: string
  primary: string
}

// Light-mode defaults used for SSR and before the first useEffect fires.
const LIGHT: ChartTheme = {
  fg:          '#0a0a0a',
  fgSecondary: '#4d4d4d',
  fgMuted:     '#808080',
  bg:          '#fafafa',
  surfaceCard: '#ffffff',
  elevated:    '#f2f2f2',
  border:      '#e0e0e0',
  primary:     '#009999',
}

function readFromDOM(): ChartTheme {
  const s = getComputedStyle(document.body)
  const v = (name: string) => s.getPropertyValue(name).trim()
  return {
    fg:          v('--fg'),
    fgSecondary: v('--fg-secondary'),
    fgMuted:     v('--fg-muted'),
    bg:          v('--bg'),
    surfaceCard: v('--surface-card'),
    elevated:    v('--elevated'),
    border:      v('--border'),
    primary:     v('--primary'),
  }
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(LIGHT)

  useEffect(() => {
    setTheme(readFromDOM())

    // Re-read whenever dark-mode class is toggled on body
    const observer = new MutationObserver(() => setTheme(readFromDOM()))
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return theme
}
