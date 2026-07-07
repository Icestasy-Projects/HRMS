// IST = UTC+5:30
export function nowIST(): Date {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000)
}

export function todayIST(): string {
  return nowIST().toISOString().slice(0, 10)
}

export function timeIST(): string {
  return nowIST().toISOString().slice(11, 19)
}

export const HALF_DAY_LATE_CUTOFF = '13:30'
export const HALF_DAY_EARLY_CUTOFF = '14:30'

export const SCHEDULE = {
  white_collar: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], hours_per_day: 9 },
  blue_collar: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], hours_per_day: 8 },
}

export function computeAttendanceStatus(
  checkIn: string,
  checkOut: string | null,
  hasScheduledHalfDay = false,
): { dayStatus: string; isHalfDay: boolean } {
  const isLate = checkIn > HALF_DAY_LATE_CUTOFF
  const isEarlyOut = checkOut ? checkOut < HALF_DAY_EARLY_CUTOFF : false

  if (isLate) return {
    dayStatus: hasScheduledHalfDay ? 'scheduled_half_day_first_off' : 'unscheduled_half_day_first_off',
    isHalfDay: true,
  }
  if (isEarlyOut) return {
    dayStatus: hasScheduledHalfDay ? 'scheduled_half_day_second_off' : 'unscheduled_half_day_second_off',
    isHalfDay: true,
  }
  return { dayStatus: 'present', isHalfDay: false }
}

export function formatTime(t: string | null): string {
  if (!t) return '--:--'
  const s = t.includes('T') ? t.split('T')[1] : t
  return s.slice(0, 5)
}
