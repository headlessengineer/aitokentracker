'use client'

import { useEffect, useMemo } from 'react'
import { NotificationManager } from './manager'
import type { NotificationContext } from './types'

export function useNotifications(context: NotificationContext | null): void {
  const manager = useMemo(() => new NotificationManager(), [])

  useEffect(() => {
    if (!context) return
    manager.requestPermission().then((granted) => {
      if (granted) manager.evaluate(context)
    })
  }, [context, manager])
}
