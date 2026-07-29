import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Wordmark } from './Wordmark'
import { OffcanvasNav } from './OffcanvasNav'
import type { PluginStatus } from '@/plugins/core/types'
import styles from './TopBar.module.css'

interface TopBarProps {
  plugins?: PluginStatus[]
  activePluginId?: string
  selectedDays?: number
}

export function TopBar({ plugins, activePluginId, selectedDays = 30 }: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <Wordmark />
        <div className={styles.spacer} />
        <ThemeToggle />
        {plugins && plugins.length > 0 && (
          <OffcanvasNav
            plugins={plugins}
            activePluginId={activePluginId}
            selectedDays={selectedDays}
          />
        )}
      </div>
    </header>
  )
}
