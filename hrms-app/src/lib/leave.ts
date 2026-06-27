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
