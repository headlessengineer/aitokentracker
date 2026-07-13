import styles from './Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'accent' | 'neutral' | 'active' | 'recent' | 'inactive'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]}`}>
      {children}
    </span>
  )
}
