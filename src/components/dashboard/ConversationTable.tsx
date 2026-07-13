import type { ConversationSummary } from '@/plugins/core/types'
import { Badge } from '@/components/ui/Badge'
import { formatTokens, formatRelativeTime, truncate } from '@/lib/format'
import styles from './ConversationTable.module.css'

interface ConversationTableProps {
  conversations: ConversationSummary[]
  limit?: number
}

export function ConversationTable({ conversations, limit = 20 }: ConversationTableProps) {
  const visible = conversations.slice(0, limit)

  if (visible.length === 0) {
    return <p className={styles.empty}>No conversations found.</p>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
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
          {visible.map((conv) => (
            <tr key={conv.id} className={styles.row}>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
