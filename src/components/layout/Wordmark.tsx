import styles from './Wordmark.module.css'

interface WordmarkProps {
  className?: string
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <span
      className={[styles.wordmark, className].filter(Boolean).join(' ')}
      aria-label="HEADLESSENGINEER"
    >
      <span className={styles.head}>HEADLESS</span>
      <span className={styles.tail}>
        <span className={styles.swapA}>ENGINEER</span>
        <span className={styles.swapB} aria-hidden="true">ENGINEER</span>
      </span>
    </span>
  )
}
