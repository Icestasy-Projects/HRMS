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

  const btnLabel = isDone ? 'Day Complete ✓' : isClockedIn ? 'Clock Out' : 'Clock In'
  const btnBg = isDone ? 'var(--success)' : isClockedIn ? 'var(--danger)' : 'var(--primary)'
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>Home / Attendance</p>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Time & Attendance
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{todayFormatted}</p>
      </div>

      {/* Today status card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: 'var(--shadow)',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1rem' }}>
          Today&apos;s Status
        </p>
        {todayLog ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>Clocked In</p>
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>{formatTime(todayLog.clock_in)}</p>
            </div>
            {todayLog.clock_out && (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0 0 0.25rem' }}>Clocked Out</p>
                <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>{formatTime(todayLog.clock_out)}</p>
              </div>
            )}
            {todayLog.is_half_day && (
              <span style={{
                background: 'var(--warning-l)', border: '1px solid var(--warning)',
                borderRadius: '999px', padding: '0.25rem 0.75rem',
                color: 'var(--warning)', fontWeight: 600, fontSize: '0.8rem',
              }}>Half Day</span>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>Not yet clocked in today</p>
        )}
      </div>

      {/* Clock button */}
      <form action={clockInOut} style={{ marginBottom: '1.25rem' }}>
        <button
          type="submit"
          disabled={!!isDone}
          style={{
            width: '100%', height: '72px',
            background: btnBg, color: '#fff',
            border: 'none', borderRadius: '0.75rem',
            fontSize: '1.25rem', fontWeight: 700,
            cursor: isDone ? 'default' : 'pointer',
            boxShadow: isDone ? 'none' : 'var(--shadow-md)',
            letterSpacing: '-0.01em',
          }}
        >
          {btnLabel}
        </button>
      </form>

      {/* Rules card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.25rem', boxShadow: 'var(--shadow)',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.875rem' }}>
          Half-Day Rules
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 700, flexShrink: 0 }}>→</span>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
              Arrive after <strong>{HALF_DAY_LATE_CUTOFF}</strong> = half day
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 700, flexShrink: 0 }}>→</span>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
              Leave before <strong>{HALF_DAY_EARLY_CUTOFF}</strong> = half day
            </p>
          </div>
          <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>
              Schedule: {schedule.days.join(', ')} · {schedule.hours_per_day}h/day ({scheduleType.replace('_', ' ')})
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
