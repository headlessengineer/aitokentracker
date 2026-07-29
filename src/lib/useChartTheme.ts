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
  n200: string
  n300: string
  n400: string
  n600: string
  n700: string
}

// SSR / pre-paint fallbacks — must match Tier-1 primitive values in globals.css exactly.
// These are used only until the first useEffect fires on the client.
const LIGHT: ChartTheme = {
  fg:          '#111111',
  fgSecondary: '#616161',
  fgMuted:     '#7c7c7c',
  bg:          '#f6f6f6',
  surfaceCard: '#ffffff',
  elevated:    '#ebebeb',
  border:      '#d4d4d4',
  primary:     '#008383',
  n200:        '#d4d4d4',
  n300:        '#b6b6b6',
  n400:        '#989898',
  n600:        '#616161',
  n700:        '#474747',
}

/**
 * CSS custom properties that chain through var() references return the raw unresolved
 * string from getComputedStyle (e.g. "var(--n-950)" not "#111111").
 *
 * The only reliable way to get the final resolved color value is to apply the token
 * as a standard CSS `color` property and read back the computed result, which the
 * browser fully resolves — including dark-mode overrides and multi-level var() chains.
 */
const TOKENS: Array<readonly [keyof ChartTheme, string]> = [
  ['fg',          '--fg'],
  ['fgSecondary', '--fg-secondary'],
  ['fgMuted',     '--fg-muted'],
  ['bg',          '--bg'],
  ['surfaceCard', '--surface-card'],
  ['elevated',    '--elevated'],
  ['border',      '--border'],
  ['primary',     '--primary'],
  ['n200',        '--n-200'],
  ['n300',        '--n-300'],
  ['n400',        '--n-400'],
  ['n600',        '--n-600'],
  ['n700',        '--n-700'],
]

function readFromDOM(): ChartTheme {
  // Batch all measurements in one temporary container to minimise reflows.
  const container = document.createElement('div')
  container.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  document.body.appendChild(container)

  const spans = TOKENS.map(([, token]) => {
    const span = document.createElement('span')
    span.style.color = `var(${token})`
    container.appendChild(span)
    return span
  })

  // Force layout so getComputedStyle returns resolved values.
  container.getBoundingClientRect()

  const theme = { ...LIGHT }
  TOKENS.forEach(([key], i) => {
    const resolved = getComputedStyle(spans[i]).color
    if (resolved) (theme as Record<string, string>)[key] = resolved
  })

  document.body.removeChild(container)
  return theme
}

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(LIGHT)

  useEffect(() => {
    const update = () => setTheme(readFromDOM())
    update()

    const observer = new MutationObserver(update)

    // Dark-mode class toggle on <body>
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // Inline CSS variable overrides on <html> (e.g. via browser console or programmatic theming)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    })

    return () => observer.disconnect()
  }, [])

  return theme
}
