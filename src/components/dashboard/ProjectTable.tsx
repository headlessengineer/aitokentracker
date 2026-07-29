import type { ProjectStats } from '@/plugins/core/types'
import { formatTokens, formatRelativeTime, truncate } from '@/lib/format'
import styles from './ConversationTable.module.css'

interface ProjectTableProps {
  projects: ProjectStats[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  if (projects.length === 0) {
    return <p className={styles.empty}>No project data available.</p>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Project</th>
            <th className={styles.th}>Tokens</th>
            <th className={styles.th}>Conversations</th>
            <th className={styles.th}>Last active</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.name} className={styles.row}>
              <td className={styles.td}>
                <span className={styles.project} title={p.name}>{truncate(p.name, 36)}</span>
              </td>
              <td className={styles.td}>
                <span className={styles.tokens}>{formatTokens(p.tokens)}</span>
              </td>
              <td className={styles.td}>{p.conversations}</td>
              <td className={styles.td}>
                <span className={styles.time}>{formatRelativeTime(p.lastActivity)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
