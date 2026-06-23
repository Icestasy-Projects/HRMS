// Core attendance business rules

export const CORE_WINDOW_START = '12:00'
export const CORE_WINDOW_END = '16:00'
export const HALF_DAY_LATE_CUTOFF = '13:30'   // arrive after → half day
export const HALF_DAY_EARLY_CUTOFF = '14:30'  // leave before → half day

// White collar: Mon–Fri, 9h/day
// Blue collar: Mon–Sat, 8h/day
export const SCHEDULE = {
  white_collar: { days_per_week: 5, hours_per_day: 9, work_days: [1,2,3,4,5] },
  blue_collar:  { days_per_week: 6, hours_per_day: 8, work_days: [1,2,3,4,5,6] },
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function computeAttendanceStatus(clockIn: string | null, clockOut: string | null): {
  isHalfDay: boolean
  reason: string | null
} {
  if (!clockIn) return { isHalfDay: false, reason: null }

  const inMins = toMinutes(clockIn)
  const lateMin = toMinutes(HALF_DAY_LATE_CUTOFF)
  const earlyMin = toMinutes(HALF_DAY_EARLY_CUTOFF)

  if (inMins > lateMin) {
    return { isHalfDay: true, reason: `Arrived after ${HALF_DAY_LATE_CUTOFF} — counted as half day` }
  }

  if (clockOut) {
    const outMins = toMinutes(clockOut)
    if (outMins < earlyMin) {
      return { isHalfDay: true, reason: `Left before ${HALF_DAY_EARLY_CUTOFF} — counted as half day` }
    }
  }

  return { isHalfDay: false, reason: null }
}

export function isWithinCoreWindow(time: string): boolean {
  const mins = toMinutes(time)
  return mins >= toMinutes(CORE_WINDOW_START) && mins <= toMinutes(CORE_WINDOW_END)
}

export function formatTime(isoTime: string | null): string {
  if (!isoTime) return '—'
  const t = isoTime.includes('T') ? isoTime.split('T')[1] : isoTime
  return t.slice(0, 5)
}

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function isWorkDay(date: Date, employeeType: 'white_collar' | 'blue_collar'): boolean {
  const dayOfWeek = date.getDay() // 0=Sun, 1=Mon ... 6=Sat
  return SCHEDULE[employeeType].work_days.includes(dayOfWeek)
}
