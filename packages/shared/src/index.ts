export * from './constants'
export * from './pricing'
export * from './types'
export * as schemas from './schemas'

// ---- Helpers ---------------------------------------------------------------

/** Current year-month in Asia/Tokyo as "YYYY-MM", matching usage_logs.yearMonth. */
export function currentYearMonthJST(now = new Date()): string {
  // JST = UTC+9, no DST. Shift then format.
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000
  const jst = new Date(utc + 9 * 3_600_000)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Format "N 時間前" / "N 日前" for the history screen. */
export function relativeTimeJa(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'たった今'
  if (mins < 60) return `${mins}分前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}日前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}ヶ月前`
  return `${Math.floor(months / 12)}年前`
}

/** Count X-platform characters; hashtags and URLs are treated as-is (not t.co shortened). */
export function countXChars(text: string): number {
  return [...text].length
}
