import { TopBar } from './TopBar'
import { Footer } from './Footer'
import type { PluginStatus } from '@/plugins/core/types'
import styles from './Shell.module.css'

interface ShellProps {
  children: React.ReactNode
  plugins?: PluginStatus[]
  activePluginId?: string
  selectedDays?: number
}

export function Shell({ children, plugins, activePluginId, selectedDays }: ShellProps) {
  return (
    <div className={styles.root}>
      <TopBar plugins={plugins} activePluginId={activePluginId} selectedDays={selectedDays} />
      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
