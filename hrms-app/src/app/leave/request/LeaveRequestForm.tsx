'use client'

import { useState, useTransition } from 'react'
import type { LeaveBalance } from '@/lib/supabase/types'
import { HALF_DAY_SCHEDULED_COST, HALF_DAY_UNSCHEDULED_COST } from '@/lib/leave'
import { format } from 'date-fns'

interface Props {
  balance: LeaveBalance | null
  submitAction: (formData: FormData) => Promise<void>
}

export default function LeaveRequestForm({ balance, submitAction }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [leaveType, setLeaveType] = useState<'scheduled' | 'unscheduled'>('scheduled')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Calculate days and deduction
  function calcWorkingDays(start: string, end: string): number {
    const s = new Date(start)
    const e = new Date(end)
    let days = 0
    const cur = new Date(s)
    while (cur <= e) {
      const dow = cur.getDay()
      if (dow !== 0 && dow !== 6) days++
      cur.setDate(cur.getDate() + 1)
    }
    return days
  }

  const workDays = isHalfDay ? 0.5 : calcWorkingDays(startDate, endDate)
  const deduction = isHalfDay
    ? (leaveType === 'scheduled' ? HALF_DAY_SCHEDULED_COST : HALF_DAY_UNSCHEDULED_COST)
    : workDays

  const currentBalance = leaveType === 'scheduled'
    ? (balance?.scheduled_balance ?? 0)
    : (balance?.unscheduled_balance ?? 0)
  const afterBalance = Math.max(0, currentBalance - deduction)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('is_half_day', isHalfDay ? 'true' : 'false')
    startTransition(() => submitAction(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Leave type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Leave Type</label>
        <div className="grid grid-cols-1 gap-3">
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${leaveType === 'scheduled' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="leave_type"
              value="scheduled"
              checked={leaveType === 'scheduled'}
              onChange={() => setLeaveType('scheduled')}
              className="mt-0.5"
            />
            <div>
              <div className="font-semibold text-gray-900">Scheduled Leave</div>
              <div className="text-sm text-gray-500 mt-0.5">Planned ahead — holiday, personal time</div>
              <div className="text-xs text-blue-700 mt-1 font-medium">Your manager will review this before it&apos;s approved.</div>
            </div>
          </label>

          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${leaveType === 'unscheduled' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="leave_type"
              value="unscheduled"
              checked={leaveType === 'unscheduled'}
              onChange={() => setLeaveType('unscheduled')}
              className="mt-0.5"
            />
            <div>
              <div className="font-semibold text-gray-900">Unscheduled Leave</div>
              <div className="text-sm text-gray-500 mt-0.5">Sick day, emergency, unexpected absence</div>
              <div className="text-xs text-green-700 mt-1 font-medium">This is recorded immediately. Your manager will be notified.</div>
            </div>
          </label>
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              value={startDate}
              min={today}
              onChange={e => {
                setStartDate(e.target.value)
                if (e.target.value > endDate) setEndDate(e.target.value)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              required
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>
        </div>

        {/* Half day */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isHalfDay}
            onChange={e => setIsHalfDay(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Half day only</span>
            <p className="text-xs text-gray-500">
              {leaveType === 'scheduled' ? `Deducts ${HALF_DAY_SCHEDULED_COST} day` : `Deducts ${HALF_DAY_UNSCHEDULED_COST} days`}
            </p>
          </div>
        </label>
      </div>

      {/* Reason */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          placeholder="Add any details that might be helpful for your manager…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
        />
      </div>

      {/* Deduction preview */}
      {workDays > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Deduction preview</div>
          <div className="text-sm text-gray-700">
            {leaveType === 'scheduled' ? 'Scheduled Leave' : 'Unscheduled Leave'}
            {isHalfDay ? ', half day' : workDays > 1 ? `, ${workDays} working days` : ', 1 working day'}
            {' → '}<strong>{deduction} day{deduction !== 1 ? 's' : ''} used</strong>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Balance: <strong>{currentBalance}</strong> → <strong className={afterBalance < 2 ? 'text-red-700' : ''}>{afterBalance}</strong>
          </div>
          {afterBalance <= 0 && deduction > currentBalance && (
            <div className="text-sm text-red-700 font-medium mt-2">
              You&apos;ve used all your leave. Any additional time off will be deducted from your pay at 1.5× the daily rate.
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || workDays === 0}
        className="w-full bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[44px] transition-colors"
      >
        {isPending ? 'Submitting…' : leaveType === 'scheduled' ? 'Submit Leave Request' : 'Record Unscheduled Leave'}
      </button>
    </form>
  )
}
