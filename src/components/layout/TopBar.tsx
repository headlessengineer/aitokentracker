import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Wordmark } from './Wordmark'
import styles from './TopBar.module.css'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <Wordmark />
        {title && <span className={styles.separator}>/</span>}
        {title && <span className={styles.title}>{title}</span>}
        <div className={styles.spacer} />
        <ThemeToggle />
      </div>
    </header>
  )
}
