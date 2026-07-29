'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Wordmark } from './Wordmark'
import type { PluginStatus } from '@/plugins/core/types'
import styles from './OffcanvasNav.module.css'

interface OffcanvasNavProps {
  plugins: PluginStatus[]
  activePluginId?: string
  selectedDays: number
}

export function OffcanvasNav({ plugins, activePluginId, selectedDays }: OffcanvasNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const open = () => setIsOpen(true)
  const close = () => {
    setIsOpen(false)
    hamburgerRef.current?.focus()
  }

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function navHref(pluginId?: string): string {
    const base = pluginId ? `/${pluginId}` : '/'
    return `${base}?days=${selectedDays}`
  }

  return (
    <>
      <button
        ref={hamburgerRef}
        className={styles.hamburger}
        aria-label="Open navigation"
        aria-expanded={isOpen}
        onClick={open}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        aria-hidden="true"
        onClick={close}
      />

      <nav
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        aria-label="Tool navigation"
      >
        <button
          ref={closeButtonRef}
          className={styles.closeButton}
          aria-label="Close navigation"
          onClick={close}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.content}>
          <Wordmark />

          <ul className={styles.navList}>
            <li>
              <Link
                href={navHref()}
                className={`${styles.navLink} ${!activePluginId ? styles.navLinkActive : ''}`}
                onClick={close}
              >
                <span className={styles.navIcon}>▦</span>
                Overview
              </Link>
            </li>
            {plugins.map((p) => (
              <li key={p.id}>
                <Link
                  href={navHref(p.id)}
                  className={`${styles.navLink} ${activePluginId === p.id ? styles.navLinkActive : ''} ${!p.available ? styles.navLinkUnavailable : ''}`}
                  onClick={close}
                >
                  <span className={styles.navIcon}>{p.icon}</span>
                  <span className={styles.navName}>{p.name}</span>
                  {!p.available && <span className={styles.navBadge}>–</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
}
