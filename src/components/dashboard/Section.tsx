import styles from './Section.module.css'

interface SectionProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function Section({ title, children, action }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </section>
  )
}
