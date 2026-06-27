export const HALF_DAY_LATE_CUTOFF = '13:30'
export const HALF_DAY_EARLY_CUTOFF = '14:30'

export const SCHEDULE = {
  white_collar: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hours_per_day: 9 },
  blue_collar: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hours_per_day: 8 },
}

export function computeAttendanceStatus(clockIn: string, clockOut: string | null) {
  const isLate = clockIn > HALF_DAY_LATE_CUTOFF
  const isEarly = clockOut ? clockOut < HALF_DAY_EARLY_CUTOFF : false
  return { isHalfDay: isLate || isEarly }
}

export function formatTime(t: string | null): string {
  if (!t) return '--:--'
  const s = t.includes('T') ? t.split('T')[1] : t
  return s.slice(0, 5)
}
