import type { LeaveBalance, LeavePolicy } from './supabase/types'

export const ANNUAL_SCHEDULED = 18
export const ANNUAL_UNSCHEDULED = 6
export const MAX_CARRYFORWARD = 12
export const HALF_DAY_SCHEDULED_COST = 0.5
export const HALF_DAY_UNSCHEDULED_COST = 0.75
export const UNPAID_MULTIPLIER = 1.5

export function calcDeduction(
  leaveType: 'scheduled' | 'unscheduled',
  isHalfDay: boolean,
  days: number
): number {
  if (isHalfDay) {
    return leaveType === 'scheduled' ? HALF_DAY_SCHEDULED_COST : HALF_DAY_UNSCHEDULED_COST
  }
  return days
}

export function carryforwardWarning(balance: LeaveBalance): string | null {
  const today = new Date()
  const month = today.getMonth() + 1
  if (month < 11) return null // only warn Oct–Dec

  const total = balance.scheduled_balance
  if (total <= MAX_CARRYFORWARD) return null

  const willLose = total - MAX_CARRYFORWARD
  return `Year-end is approaching. You currently have ${total} scheduled days left. Only ${MAX_CARRYFORWARD} days carry forward — you will lose ${willLose} day${willLose !== 1 ? 's' : ''} if unused.`
}

export function unpaidLeaveWarning(leaveType: 'scheduled' | 'unscheduled', balance: LeaveBalance): string | null {
  const available = leaveType === 'scheduled' ? balance.scheduled_balance : balance.unscheduled_balance
  if (available > 0) return null
  return `You've used all your ${leaveType === 'scheduled' ? 'scheduled' : 'unscheduled'} leave. Any more time off will be deducted from your pay at ${UNPAID_MULTIPLIER}× the daily rate.`
}

export function balanceLabel(balance: number, total: number, type: string): string {
  return `${balance} ${type} day${balance !== 1 ? 's' : ''} left of ${total}`
}
