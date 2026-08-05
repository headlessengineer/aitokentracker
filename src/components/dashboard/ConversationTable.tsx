'use client'

import { Fragment, useState, useEffect, useMemo, useRef } from 'react'
import type { ConversationSummary } from '@/plugins/core/types'
import { Badge } from '@/components/ui/Badge'
import { formatTokens, formatRelativeTime, truncate } from '@/lib/format'
import styles from './ConversationTable.module.css'

interface ConversationTableProps {
  conversations: ConversationSummary[]
  limit?: number
  initialSearch?: string
}

export function ConversationTable({ conversations, limit = 20, initialSearch = '' }: ConversationTableProps) {
  const [search, setSearch] = useState(initialSearch)
  const [focusedIdx, setFocusedIdx] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  // Debounce URL update — uses history.replaceState to avoid Suspense requirements
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const term = search.trim()
      if (term) {
        params.set('search', term)
      } else {
        params.delete('search')
      }
      const qs = params.toString()
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conversations.slice(0, limit)
    return conversations
      .filter(
        (c) =>
          c.project.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term),
      )
      .slice(0, limit)
  }, [conversations, search, limit])

  // Reset focus to first row when the visible list changes
  useEffect(() => {
    setFocusedIdx(0)
  }, [filtered.length])

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleRowKeyDown(e: React.KeyboardEvent, idx: number, id: string) {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = Math.min(idx + 1, filtered.length - 1)
        setFocusedIdx(next)
        rowRefs.current[next]?.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = Math.max(idx - 1, 0)
        setFocusedIdx(prev)
        rowRefs.current[prev]?.focus()
        break
      }
      case 'Enter':
      case ' ': {
        e.preventDefault()
        toggleExpand(id)
        break
      }
    }
  }

  return (
    <div>
      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Filter by project or conversation ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filter conversations"
        />
        {search.trim() && (
          <span className={styles.searchCount}>
            {filtered.length} of {conversations.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>No conversations match &ldquo;{search}&rdquo;.</p>
      ) : (
        <div className={styles.wrapper}>
          <table className={styles.table} role="grid">
            <thead>
              <tr>
                <th className={styles.th}>Project</th>
                <th className={styles.th}>Model</th>
                <th className={styles.th}>Tokens</th>
                <th className={styles.th}>Messages</th>
                <th className={styles.th}>Last active</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((conv, idx) => (
                <Fragment key={conv.id}>
                  <tr
                    ref={(el) => { rowRefs.current[idx] = el }}
                    className={`${styles.row} ${expandedIds.has(conv.id) ? styles.rowExpanded : ''}`}
                    tabIndex={idx === focusedIdx ? 0 : -1}
                    aria-selected={expandedIds.has(conv.id)}
                    aria-expanded={expandedIds.has(conv.id)}
                    onFocus={() => setFocusedIdx(idx)}
                    onKeyDown={(e) => handleRowKeyDown(e, idx, conv.id)}
                    onClick={() => toggleExpand(conv.id)}
                  >
                    <td className={styles.td}>
                      <span className={styles.project} title={conv.project}>
                        {truncate(conv.project, 28)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.model}>{conv.model ? truncate(conv.model, 20) : '—'}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.tokens}>{formatTokens(conv.tokens.total)}</span>
                    </td>
                    <td className={styles.td}>{conv.messageCount}</td>
                    <td className={styles.td}>
                      <span className={styles.time}>{formatRelativeTime(conv.lastActivity)}</span>
                    </td>
                    <td className={styles.td}>
                      <Badge variant={conv.status}>{conv.status}</Badge>
                    </td>
                  </tr>
                  {expandedIds.has(conv.id) && (
                    <tr className={styles.detailRow}>
                      <td colSpan={6} className={styles.detailCell}>
                        <div className={styles.detailGrid}>
                          <span><span className={styles.detailLabel}>Input</span>{formatTokens(conv.tokens.input)}</span>
                          <span><span className={styles.detailLabel}>Output</span>{formatTokens(conv.tokens.output)}</span>
                          <span><span className={styles.detailLabel}>Cache read</span>{formatTokens(conv.tokens.cacheRead)}</span>
                          <span><span className={styles.detailLabel}>Cache write</span>{formatTokens(conv.tokens.cacheWrite)}</span>
                          <span><span className={styles.detailLabel}>Created</span>{new Date(conv.created).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
