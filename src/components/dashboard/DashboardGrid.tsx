'use client'

import { useState, useCallback, useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import styles from './DashboardGrid.module.css'

const RGL = WidthProvider(Responsive)

export type WidgetDef = {
  id: string
  content: React.ReactNode
  defaultPos: { x: number; y: number; w: number; h: number; minW?: number; minH?: number }
}

type Props = {
  widgets: WidgetDef[]
  pluginId: string
}

const BREAKPOINTS = { lg: 1280, md: 768, sm: 480, xs: 0 }
const COLS = { lg: 12, md: 12, sm: 6, xs: 4 }
const ROW_HEIGHT = 80

function toLayouts(widgets: WidgetDef[]): ResponsiveLayouts {
  const lg: LayoutItem[] = widgets.map((w) => ({
    i: w.id,
    x: w.defaultPos.x,
    y: w.defaultPos.y,
    w: w.defaultPos.w,
    h: w.defaultPos.h,
    minW: w.defaultPos.minW ?? 2,
    minH: w.defaultPos.minH ?? 2,
  }))
  return { lg }
}

function mergeWithSaved(saved: ResponsiveLayouts, widgets: WidgetDef[]): ResponsiveLayouts {
  const existing: readonly LayoutItem[] = saved.lg ?? []
  const savedIds = new Set(existing.map((l) => l.i))
  const appended: LayoutItem[] = widgets
    .filter((w) => !savedIds.has(w.id))
    .map((w) => ({
      i: w.id,
      x: w.defaultPos.x,
      y: 9999,
      w: w.defaultPos.w,
      h: w.defaultPos.h,
      minW: w.defaultPos.minW ?? 2,
      minH: w.defaultPos.minH ?? 2,
    }))
  return { ...saved, lg: [...existing, ...appended] }
}

export function DashboardGrid({ widgets, pluginId }: Props) {
  const storageKey = `aitokentracker-layout-${pluginId}`
  const [editMode, setEditMode] = useState(false)
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() => toLayouts(widgets))

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as ResponsiveLayouts
        setLayouts(mergeWithSaved(parsed, widgets))
        return
      }
    } catch { /* ignore */ }
    setLayouts(toLayouts(widgets))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const onLayoutChange = useCallback(
    (_current: Layout, all: ResponsiveLayouts) => {
      setLayouts(all)
      try { localStorage.setItem(storageKey, JSON.stringify(all)) } catch { /* ignore */ }
    },
    [storageKey],
  )

  const resetLayout = useCallback(() => {
    const defaults = toLayouts(widgets)
    setLayouts(defaults)
    try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
  }, [widgets, storageKey])

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        {editMode && (
          <button className={styles.resetBtn} onClick={resetLayout}>
            Reset layout
          </button>
        )}
        <button
          className={`${styles.editBtn} ${editMode ? styles.editActive : ''}`}
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? 'Done editing' : 'Edit layout'}
        </button>
      </div>

      <RGL
        className={styles.grid}
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle={`.${styles.dragHandle}`}
        onLayoutChange={onLayoutChange}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms
      >
        {widgets.map((w) => (
          <div key={w.id} className={`${styles.card} ${editMode ? styles.cardEdit : ''}`}>
            {editMode && (
              <div className={styles.dragHandle}>
                <span className={styles.dragDots} aria-hidden>⠿</span>
                <span className={styles.dragHint}>drag to reposition · resize from corner</span>
              </div>
            )}
            <div className={styles.cardContent}>
              {w.content}
            </div>
          </div>
        ))}
      </RGL>
    </div>
  )
}
