import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { computeAttendanceStatus, formatTime, HALF_DAY_LATE_CUTOFF, HALF_DAY_EARLY_CUTOFF, SCHEDULE } from '@/lib/attendance'
import { format } from 'date-fns'

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
  if (!employee) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: attendance } = await supabase.from('attendance_logs').select('*').eq('employee_id', employee.id).eq('date', today).maybeSingle()

  const schedule = SCHEDULE[employee.employee_type as keyof typeof SCHEDULE] ?? SCHEDULE.white_collar
  const clockedIn = attendance?.clock_in && !attendance?.clock_out
  const clockedOut = attendance?.clock_in && attendance?.clock_out

  let hoursWorked: string | null = null
  if (attendance?.clock_in) {
    const inTime = new Date(`${today}T${attendance.clock_in.includes('T') ? attendance.clock_in.split('T')[1] : attendance.clock_in}`)
    const outTime = attendance.clock_out
      ? new Date(`${today}T${attendance.clock_out.includes('T') ? attendance.clock_out.split('T')[1] : attendance.clock_out}`)
      : new Date()
    const mins = Math.floor((outTime.getTime() - inTime.getTime()) / 60000)
    hoursWorked = `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  async function clockInOut() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
    if (!employee) return
    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')
    const timeStr = format(now, 'HH:mm:ss')
    const { data: existing } = await supabase.from('attendance_logs').select('*').eq('employee_id', employee.id).eq('date', today).maybeSingle()
    if (!existing) {
      const { isHalfDay } = computeAttendanceStatus(timeStr, null)
      await supabase.from('attendance_logs').insert({ employee_id: employee.id, date: today, clock_in: timeStr, status: 'present', is_half_day: isHalfDay })
    } else if (existing.clock_in && !existing.clock_out) {
      const cin = existing.clock_in.includes('T') ? existing.clock_in.split('T')[1].slice(0, 8) : existing.clock_in.slice(0, 8)
      const { isHalfDay } = computeAttendanceStatus(cin, timeStr)
      await supabase.from('attendance_logs').update({ clock_out: timeStr, is_half_day: isHalfDay, status: isHalfDay ? 'half_day' : 'present' }).eq('id', existing.id)
    }
    revalidatePath('/attendance')
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Clock In / Clock Out</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Record when you arrive and leave each day.</p>
      </div>

      {/* Date */}
      <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{format(new Date(), 'd MMMM yyyy')}</div>
        <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{format(new Date(), 'EEEE')}</div>
      </div>

      {/* Half-day rules */}
      <div className="rounded-2xl border p-4" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
        <div className="font-semibold text-sm mb-1" style={{ color: 'var(--warning)' }}>Half-day rules</div>
        <ul className="text-sm space-y-0.5" style={{ color: 'var(--muted)' }}>
          <li>• Arriving after <strong style={{ color: 'var(--text)' }}>{HALF_DAY_LATE_CUTOFF}</strong> counts as a half day</li>
          <li>• Leaving before <strong style={{ color: 'var(--text)' }}>{HALF_DAY_EARLY_CUTOFF}</strong> counts as a half day</li>
        </ul>
      </div>

      {/* Schedule */}
      <div className="rounded-2xl border p-4" style={{ background: 'rgba(139,47,201,0.1)', borderColor: 'rgba(139,47,201,0.3)' }}>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Your schedule: </strong>
          {employee.employee_type === 'white_collar' ? 'Monday to Friday, 9 hours/day' : 'Monday to Saturday, 8 hours/day'}
        </span>
      </div>

      {/* Status + button */}
      <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {!attendance && (
          <div className="mb-5">
            <div className="text-5xl font-bold mb-2" style={{ color: 'var(--border)' }}>--:--</div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>You haven&apos;t clocked in today.</p>
          </div>
        )}
        {clockedIn && (
          <div className="mb-5">
            <div className="text-5xl font-bold mb-1" style={{ color: 'var(--success)' }}>{formatTime(attendance.clock_in)}</div>
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Clocked in · {hoursWorked} so far</p>
            {attendance.is_half_day && <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>Half day — arrived after {HALF_DAY_LATE_CUTOFF}</p>}
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Expected: <strong style={{ color: 'var(--text)' }}>{schedule.hours_per_day}h</strong> today</p>
          </div>
        )}
        {clockedOut && (
          <div className="mb-5">
            <div className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{formatTime(attendance.clock_in)} – {formatTime(attendance.clock_out)}</div>
            <span className="inline-block rounded-full px-4 py-1.5 text-sm font-medium mb-2"
              style={{ background: attendance.is_half_day ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: attendance.is_half_day ? 'var(--warning)' : 'var(--success)' }}>
              {attendance.is_half_day ? 'Half day recorded' : 'Full day recorded'}
            </span>
            {hoursWorked && <p className="text-sm" style={{ color: 'var(--muted)' }}>Hours worked: <strong style={{ color: 'var(--text)' }}>{hoursWorked}</strong></p>}
          </div>
        )}
        {!clockedOut && (
          <form action={clockInOut}>
            <button type="submit" className="w-full rounded-2xl px-6 py-5 text-xl font-bold text-white transition-colors"
              style={{ background: clockedIn ? 'var(--danger)' : 'var(--primary)', minHeight: '80px' }}>
              {clockedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </form>
        )}
      </div>

      <div className="text-center">
        <a href="/attendance/history" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary-h)' }}>
          View full attendance history →
        </a>
      </div>
    </div>
  )
}
