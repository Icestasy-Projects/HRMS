import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime, HALF_DAY_LATE_CUTOFF, HALF_DAY_EARLY_CUTOFF, SCHEDULE, computeAttendanceStatus } from '@/lib/attendance'

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

  const today = new Date().toISOString().split('T')[0]

  const { data: todayLog } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .single()

  const isClockedIn = todayLog && !todayLog.clock_out
  const isDone = todayLog && todayLog.clock_out

  const scheduleType = employee.employee_type === 'blue_collar' ? 'blue_collar' : 'white_collar'
  const schedule = SCHEDULE[scheduleType]

  async function clockInOut() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('users').select('*').eq('email', user.email).single()
    if (!emp) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 8)

    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('date', today)
      .single()

    if (!existing) {
      const { isHalfDay } = computeAttendanceStatus(timeStr, null)
      await supabase.from('attendance_logs').insert({
        employee_id: emp.id,
        date: today,
        clock_in: timeStr,
        status: isHalfDay ? 'half_day' : 'present',
        is_half_day: isHalfDay,
      })
    } else if (!existing.clock_out) {
      const { isHalfDay } = computeAttendanceStatus(existing.clock_in, timeStr)
      await supabase
        .from('attendance_logs')
        .update({
          clock_out: timeStr,
          is_half_day: isHalfDay,
          status: isHalfDay ? 'half_day' : 'present',
        })
        .eq('id', existing.id)
    }

    redirect('/attendance')
  }

  const btnLabel = isDone ? 'Already Complete' : isClockedIn ? 'Clock Out' : 'Clock In'
  const btnColor = isDone ? 'var(--muted)' : isClockedIn ? 'var(--danger)' : 'var(--primary)'

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Clock In / Out
      </h1>

      {/* Half-day rules */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Half-Day Rules
        </p>
        <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
          • Clock in after {HALF_DAY_LATE_CUTOFF} → counted as half day
        </p>
        <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: '0.25rem 0' }}>
          • Clock out before {HALF_DAY_EARLY_CUTOFF} → counted as half day
        </p>
      </div>

      {/* Schedule info */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Your Schedule ({scheduleType.replace('_', ' ')})
        </p>
        <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
          {schedule.days.join(', ')} · {schedule.hours_per_day}h/day
        </p>
      </div>

      {/* Current status */}
      {todayLog && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Today
          </p>
          <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
            Clocked in: <strong>{formatTime(todayLog.clock_in)}</strong>
          </p>
          {todayLog.clock_out && (
            <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
              Clocked out: <strong>{formatTime(todayLog.clock_out)}</strong>
            </p>
          )}
          {todayLog.is_half_day && (
            <p style={{ color: 'var(--warning)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Marked as half day
            </p>
          )}
        </div>
      )}

      {/* Clock button */}
      <form action={clockInOut}>
        <button
          type="submit"
          disabled={!!isDone}
          style={{
            width: '100%',
            height: '80px',
            background: btnColor,
            color: 'var(--text)',
            border: 'none',
            borderRadius: '1rem',
            fontSize: '1.25rem',
            fontWeight: 700,
            cursor: isDone ? 'not-allowed' : 'pointer',
            opacity: isDone ? 0.6 : 1,
          }}
        >
          {btnLabel}
        </button>
      </form>
    </div>
  )
}
