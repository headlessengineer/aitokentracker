export function sinceDate(days: number): Date {
  if (days === 0) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (days >= 9999) {
    return new Date(0)
  }
  return new Date(Date.now() - days * 86_400_000)
}
