import styles from './KPICard.module.css'

interface KPICardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
}

export function KPICard({ label, value, sub, accent }: KPICardProps) {
  return (
    <div className={`${styles.card} ${accent ? styles.accent : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {sub && <span className={styles.sub}>{sub}</span>}
    </div>
  )
}
