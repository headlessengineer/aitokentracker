import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

export function Skeleton({ width, height = 16, borderRadius, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
      aria-hidden
    />
  )
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <Skeleton width={80} height={12} />
      <Skeleton width={120} height={32} borderRadius="var(--radius-sm)" />
      <Skeleton width={60} height={10} />
    </div>
  )
}
