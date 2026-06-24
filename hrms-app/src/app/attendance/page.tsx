import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime, HALF_DAY_LATE_CUTOFF, HALF_DAY_EARLY_CUTOFF, SCHEDULE, computeAttendanceStatus } from '@/lib/attendance'
import { SubmitButton } from '@/components/SubmitButton'

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
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

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
        .update({ clock_out: timeStr, is_half_day: isHalfDay, status: isHalfDay ? 'half_day' : 'present' })
        .eq('id', existing.id)
    }

    redirect('/attendance')
  }

  const btnLabel = isDone ? 'Day Complete ✓' : isClockedIn ? 'Clock Out' : 'Clock In'
  const btnBg = isDone ? 'var(--success)' : isClockedIn ? 'var(--danger)' : 'var(--primary)'

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
        Attendance
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>{todayFormatted}</p>

      {/* Today status */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1.125rem',
        padding: '1.5rem',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
          Today's Status
        </p>

        {todayLog ? (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Clocked In</p>
              <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>{formatTime(todayLog.clock_in)}</p>
            </div>
            {todayLog.clock_out && (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Clocked Out</p>
                <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>{formatTime(todayLog.clock_out)}</p>
              </div>
            )}
            {todayLog.is_half_day && (
              <div style={{
                background: 'var(--warning-l)',
                border: '1px solid var(--warning)',
                borderRadius: '0.625rem',
                padding: '0.375rem 0.75rem',
                alignSelf: 'center',
              }}>
                <p style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.8rem', margin: 0 }}>Half Day</p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>Not yet clocked in today</p>
        )}
      </div>

      {/* Clock button */}
      <form action={clockInOut} style={{ marginBottom: '1.25rem' }}>
        <SubmitButton
          loadingText={isClockedIn ? 'Clocking out...' : 'Clocking in...'}
          style={{
            width: '100%',
            height: '72px',
            background: btnBg,
            color: '#fff',
            border: 'none',
            borderRadius: '1.125rem',
            fontSize: '1.25rem',
            fontWeight: 700,
            boxShadow: isDone ? 'none' : 'var(--shadow-md)',
            letterSpacing: '-0.01em',
          }}
        >
          {btnLabel}
        </SubmitButton>
      </form>

      {/* Rules */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1.125rem',
        padding: '1.25rem',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.875rem' }}>
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
