import type { ProviderLimit } from '@/lib/limits'
import styles from './LimitStatus.module.css'

interface Props {
  limits: ProviderLimit[]
}

function resetLabel(resetAt: Date | null): string {
  if (!resetAt) return ''
  const diffMs = resetAt.getTime() - Date.now()
  if (diffMs <= 0) return 'resets now'
  const h = Math.floor(diffMs / 3_600_000)
  const m = Math.floor((diffMs % 3_600_000) / 60_000)
  if (h >= 1) return `resets in ${h}h ${m}m`
  return `resets in ${m}m`
}

function pctColor(pct: number): string {
  if (pct >= 90) return 'var(--error, #c0392b)'
  if (pct >= 70) return 'var(--warning, #e67e22)'
  return 'var(--primary)'
}

export function LimitStatus({ limits }: Props) {
  if (limits.length === 0) return null

  return (
    <div className={styles.container}>
      {limits.map((limit) => {
        const showBar = limit.total > 0
        const pct = Math.min(100, limit.pct)
        return (
          <div key={`${limit.pluginId}-${limit.unit}`} className={styles.row}>
            <div className={styles.meta}>
              <span className={styles.provider}>{limit.provider}</span>
              <span className={styles.counts}>
                {limit.used.toLocaleString()}
                {limit.total > 0 && ` / ${limit.total.toLocaleString()}`}
                {' '}{limit.unit}
              </span>
              {limit.resetAt && (
                <span className={styles.reset}>{resetLabel(limit.resetAt)}</span>
              )}
            </div>
            {showBar && (
              <div className={styles.track}>
                <div
                  className={styles.fill}
                  style={{
                    width: `${pct}%`,
                    background: pctColor(pct),
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
