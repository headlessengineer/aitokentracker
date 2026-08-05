import Link from 'next/link'
import type { UnifiedProject } from '@/app/page'
import { formatTokens, formatRelativeTime, truncate, formatCost } from '@/lib/format'
import styles from './ConversationTable.module.css'
import tableStyles from './UnifiedProjectTable.module.css'

interface Props {
  projects: UnifiedProject[]
  projectFilter?: string
}

export function UnifiedProjectTable({ projects, projectFilter }: Props) {
  const visible = projectFilter
    ? projects.filter((p) => p.name.toLowerCase().includes(projectFilter.toLowerCase()))
    : projects

  const hasCost = visible.some((p) => p.totalCostUSD > 0)

  if (visible.length === 0) {
    return <p className={styles.empty}>{projectFilter ? `No projects matching "${projectFilter}".` : 'No project data available.'}</p>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Project</th>
            <th className={styles.th}>Tokens</th>
            {hasCost && <th className={styles.th}>Cost</th>}
            <th className={styles.th}>Conversations</th>
            <th className={styles.th}>Tools</th>
            <th className={styles.th}>Last active</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p) => (
            <tr key={p.name} className={`${styles.row} ${projectFilter === p.name ? tableStyles.highlighted : ''}`}>
              <td className={styles.td}>
                <Link
                  href={`?project=${encodeURIComponent(p.name)}`}
                  className={tableStyles.projectLink}
                  title={p.name}
                >
                  {truncate(p.name, 36)}
                </Link>
              </td>
              <td className={styles.td}>
                <span className={styles.tokens}>{formatTokens(p.totalTokens)}</span>
              </td>
              {hasCost && (
                <td className={styles.td}>
                  <span className={tableStyles.cost}>{p.totalCostUSD > 0 ? formatCost(p.totalCostUSD) : '—'}</span>
                </td>
              )}
              <td className={styles.td}>{p.totalConversations}</td>
              <td className={styles.td}>
                <span className={tableStyles.tools}>
                  {p.byPlugin.map((bp) => (
                    <span key={bp.pluginId} className={tableStyles.toolChip} title={`${bp.pluginName}: ${formatTokens(bp.tokens)}`}>
                      {bp.pluginName}
                    </span>
                  ))}
                </span>
              </td>
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
