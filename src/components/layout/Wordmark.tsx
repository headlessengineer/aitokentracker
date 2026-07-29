import Link from 'next/link'
import styles from './Wordmark.module.css'

interface WordmarkProps {
  className?: string
}

export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={[styles.wordmark, className].filter(Boolean).join(' ')}
      aria-label="Token Tracker — go to overview"
    >
      <span className={styles.head}>TOKEN</span>
      <span className={styles.tail}>
        <span className={styles.swapA}>TRACKER</span>
        <span className={styles.swapB} aria-hidden="true">TRACKER</span>
      </span>
    </Link>
  )
}
