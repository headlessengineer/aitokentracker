'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  /** Used when SSE is unavailable or the connection drops. Defaults to 10s. */
  fallbackIntervalMs?: number
}

/**
 * Subscribes to /api/stream (SSE) and calls router.refresh() when any plugin's
 * data files change on disk. Falls back to polling if SSE is unavailable or the
 * connection drops, and re-attempts the SSE connection every 8 seconds.
 */
export function LiveUpdater({ fallbackIntervalMs = 10_000 }: Props) {
  const router = useRouter()
  // Stable refs so the effect closure always sees the latest values
  const routerRef = useRef(router)
  const fallbackRef = useRef(fallbackIntervalMs)
  routerRef.current = router
  fallbackRef.current = fallbackIntervalMs

  useEffect(() => {
    // Guard for environments where EventSource isn't available (old proxies, tests)
    if (typeof EventSource === 'undefined') {
      const id = setInterval(() => routerRef.current.refresh(), fallbackRef.current)
      return () => clearInterval(id)
    }

    let es: EventSource | null = null
    let fallbackTimer: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function startFallback() {
      if (fallbackTimer !== null) return
      fallbackTimer = setInterval(() => routerRef.current.refresh(), fallbackRef.current)
    }

    function stopFallback() {
      if (fallbackTimer !== null) {
        clearInterval(fallbackTimer)
        fallbackTimer = null
      }
    }

    function connect() {
      if (destroyed) return
      es = new EventSource('/api/stream')

      es.onopen = () => {
        stopFallback()
      }

      es.onmessage = () => {
        routerRef.current.refresh()
      }

      es.onerror = () => {
        es?.close()
        es = null
        startFallback()
        // Attempt reconnect after 8s
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, 8_000)
        }
      }
    }

    connect()

    return () => {
      destroyed = true
      es?.close()
      stopFallback()
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
    }
  }, []) // empty deps — router via ref, no re-subscribe needed

  return null
}
