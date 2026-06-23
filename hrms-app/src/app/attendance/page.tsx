import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { computeAttendanceStatus, formatTime, HALF_DAY_LATE_CUTOFF, HALF_DAY_EARLY_CUTOFF, SCHEDULE } from '@/lib/attendance'
import { format } from 'date-fns'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!employee) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .maybeSingle()

  const schedule = SCHEDULE[employee.employee_type as keyof typeof SCHEDULE]
  const clockedIn = attendance?.clock_in && !attendance?.clock_out
  const clockedOut = attendance?.clock_in && attendance?.clock_out

  // Calculate hours worked if clocked in
  let hoursWorked: string | null = null
  if (attendance?.clock_in) {
    const inTime = new Date(`${today}T${attendance.clock_in.includes('T') ? attendance.clock_in.split('T')[1] : attendance.clock_in}`)
    const outTime = attendance.clock_out
      ? new Date(`${today}T${attendance.clock_out.includes('T') ? attendance.clock_out.split('T')[1] : attendance.clock_out}`)
      : new Date()
    const diffMs = outTime.getTime() - inTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const h = Math.floor(diffMins / 60)
    const m = diffMins % 60
    hoursWorked = m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  async function clockInOut() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: employee } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()
    if (!employee) return

    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')
    const timeStr = format(now, 'HH:mm:ss')

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .maybeSingle()

    if (!existing) {
      // Clock in
      const { isHalfDay } = computeAttendanceStatus(timeStr, null)
      await supabase.from('attendance').insert({
        employee_id: employee.id,
        date: today,
        clock_in: timeStr,
        status: 'present',
        is_half_day: isHalfDay,
      })
    } else if (existing.clock_in && !existing.clock_out) {
      // Clock out
      const clockInTime = existing.clock_in.includes('T') ? existing.clock_in.split('T')[1].slice(0, 8) : existing.clock_in.slice(0, 8)
      const { isHalfDay } = computeAttendanceStatus(clockInTime, timeStr)
      await supabase
        .from('attendance')
        .update({
          clock_out: timeStr,
          is_half_day: isHalfDay,
          status: isHalfDay ? 'half_day' : 'present',
        })
        .eq('id', existing.id)
    }

    revalidatePath('/attendance')
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Page description */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Clock In / Clock Out</h1>
        <p className="text-gray-500 text-sm mt-1">
          Record when you arrive and leave each day. This page shows your status for today.
        </p>
      </div>

      {/* Today's date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{format(new Date(), 'd MMMM yyyy')}</div>
          <div className="text-gray-500 mt-1">{format(new Date(), 'EEEE')}</div>
        </div>
      </div>

      {/* Half-day rules — shown prominently */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="font-semibold text-amber-900 text-sm mb-1">Half-day rules</div>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Arriving after <strong>{HALF_DAY_LATE_CUTOFF}</strong> counts as a half day.</li>
          <li>• Leaving before <strong>{HALF_DAY_EARLY_CUTOFF}</strong> counts as a half day.</li>
        </ul>
      </div>

      {/* Schedule info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Your schedule:</strong>{' '}
        {employee.employee_type === 'white_collar'
          ? 'Monday to Friday, 9 hours per day'
          : 'Monday to Saturday, 8 hours per day'}
      </div>

      {/* Current status & action */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
        {!attendance && (
          <>
            <div className="text-5xl font-bold text-gray-300 mb-2">--:--</div>
            <p className="text-gray-500 text-sm mb-5">You haven&apos;t clocked in today.</p>
          </>
        )}

        {clockedIn && (
          <>
            <div className="text-5xl font-bold text-green-700 mb-1">{formatTime(attendance.clock_in)}</div>
            <p className="text-gray-500 text-sm mb-1">Clocked in</p>
            {hoursWorked && <p className="text-gray-600 text-sm mb-1">Time so far: <strong>{hoursWorked}</strong></p>}
            {attendance.is_half_day && (
              <p className="text-amber-700 text-sm font-medium mb-3">Half day — arrived after {HALF_DAY_LATE_CUTOFF}</p>
            )}
            <p className="text-gray-500 text-sm mb-5">
              Expected hours today: <strong>{schedule.hours_per_day}h</strong>
            </p>
          </>
        )}

        {clockedOut && (
          <>
            <div className="text-lg font-semibold text-gray-700 mb-1">
              {formatTime(attendance.clock_in)} – {formatTime(attendance.clock_out)}
            </div>
            <div className="flex justify-center mb-2">
              <span className={attendance.is_half_day
                ? 'bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium'
                : 'bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium'
              }>
                {attendance.is_half_day ? 'Half day recorded' : 'Full day recorded'}
              </span>
            </div>
            {hoursWorked && <p className="text-gray-500 text-sm mb-2">Hours worked: <strong>{hoursWorked}</strong></p>}
            <p className="text-gray-500 text-sm">You&apos;ve clocked out for today.</p>
          </>
        )}

        {!clockedOut && (
          <form action={clockInOut}>
            <button
              type="submit"
              className={`w-full rounded-xl px-6 py-5 text-xl font-bold text-white min-h-[72px] transition-colors ${
                clockedIn
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {clockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </form>
        )}
      </div>

      {/* View history link */}
      <div className="text-center">
        <a href="/attendance/history" className="text-blue-700 hover:underline text-sm font-medium">
          View your full attendance history →
        </a>
      </div>
    </div>
  )
}
