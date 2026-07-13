import type { PluginStatus } from '@/plugins/core/types'
import { Badge } from '@/components/ui/Badge'
import styles from './PluginCard.module.css'

interface PluginCardProps {
  plugin: PluginStatus
  totalTokens?: number
  conversations?: number
  href?: string
}

export function PluginCard({ plugin, totalTokens, conversations, href }: PluginCardProps) {
  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  const content = (
    <div className={`${styles.card} ${plugin.available ? styles.available : styles.unavailable}`}>
      <div className={styles.header}>
        <div className={styles.icon} aria-hidden>{plugin.icon}</div>
        <div className={styles.meta}>
          <span className={styles.name}>{plugin.name}</span>
          <Badge variant={plugin.available ? 'active' : 'neutral'}>
            {plugin.available ? 'Active' : 'Not configured'}
          </Badge>
        </div>
      </div>

      {plugin.available && totalTokens !== undefined ? (
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatTokens(totalTokens)}</span>
            <span className={styles.statLabel}>tokens</span>
          </div>
          {conversations !== undefined && (
            <div className={styles.stat}>
              <span className={styles.statValue}>{conversations}</span>
              <span className={styles.statLabel}>conversations</span>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.description}>{plugin.description}</p>
      )}
    </div>
  )

  if (href && plugin.available) {
    return <a href={href} className={styles.link}>{content}</a>
  }

  return content
}
