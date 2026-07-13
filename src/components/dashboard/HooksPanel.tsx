import type { HookStats } from '@/plugins/core/types'
import styles from './HooksPanel.module.css'

interface HooksPanelProps {
  hooks: HookStats[]
}

const EVENT_ORDER = ['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop']

export function HooksPanel({ hooks }: HooksPanelProps) {
  if (hooks.length === 0) {
    return (
      <p className={styles.empty}>
        No hooks configured. Add hooks to <code>~/.claude/settings.json</code> to track them here.
      </p>
    )
  }

  const sorted = [...hooks].sort((a, b) => {
    const ai = EVENT_ORDER.indexOf(a.event)
    const bi = EVENT_ORDER.indexOf(b.event)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.event.localeCompare(b.event)
  })

  return (
    <div className={styles.list}>
      {sorted.map((hook, i) => (
        <div key={`${hook.event}-${i}`} className={styles.row}>
          <div className={styles.eventBadge} data-event={hook.event}>
            {hook.event}
          </div>
          <span className={styles.approx}>
            ≈ {hook.callCount.toLocaleString()} fires
          </span>
          <span className={styles.note}>estimated from tool calls</span>
        </div>
      ))}
      <p className={styles.sourceNote}>
        Hook definitions read from <code>~/.claude/settings.json</code>. Call counts are approximated from matching tool invocations.
      </p>
    </div>
  )
}
