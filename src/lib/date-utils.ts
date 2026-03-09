export function parseDesignatedDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 8) return null
  const year = parseInt(dateStr.slice(0, 4), 10)
  const month = parseInt(dateStr.slice(4, 6), 10) - 1
  const day = parseInt(dateStr.slice(6, 8), 10)
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return null
  return date
}

export function formatDesignatedDate(dateStr: string): string {
  const date = parseDesignatedDate(dateStr)
  if (!date) return '지정일 정보 없음'
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

export function isOlderThanYears(dateStr: string, years: number): boolean {
  const date = parseDesignatedDate(dateStr)
  if (!date) return false
  const threshold = new Date()
  threshold.setFullYear(threshold.getFullYear() - years)
  return date < threshold
}
