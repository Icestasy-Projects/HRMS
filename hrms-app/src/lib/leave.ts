// Count working days between two date strings (YYYY-MM-DD), excluding weekends and given holidays
export function countWorkdays(startDate: string, endDate: string, holidays: string[] = []): number {
  const holidaySet = new Set(holidays)
  let count = 0
  const cur = new Date(startDate)
  const end = new Date(endDate)
  while (cur <= end) {
    const day = cur.getDay()
    const iso = cur.toISOString().split('T')[0]
    if (day !== 0 && day !== 6 && !holidaySet.has(iso)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function carryforwardWarning(scheduledBalance: number): string | null {
  const month = new Date().getMonth() + 1
  if (month >= 10 && scheduledBalance > 12) {
    return `You have ${scheduledBalance} scheduled days left. Only 12 carry forward to next year — use them before December 31.`
  }
  return null
}

export function unpaidLeaveWarning(scheduled: number, unscheduled: number): string | null {
  if (scheduled === 0 && unscheduled === 0) {
    return 'No leave balance remaining. Any time off will be deducted at 1.5× your daily pay.'
  }
  return null
}

export function balanceLabel(balance: number, total: number, type: 'scheduled' | 'unscheduled'): string {
  const label = type === 'scheduled' ? 'Scheduled days left' : 'Sick/emergency days left'
  return `${label} (${total - balance} used of ${total})`
}
