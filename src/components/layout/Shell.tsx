import { TopBar } from './TopBar'
import styles from './Shell.module.css'

interface ShellProps {
  children: React.ReactNode
  title?: string
}

export function Shell({ children, title }: ShellProps) {
  return (
    <div className={styles.root}>
      <TopBar title={title} />
      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </div>
  )
}
