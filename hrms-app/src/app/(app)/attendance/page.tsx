import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime, HALF_DAY_LATE_CUTOFF, HALF_DAY_EARLY_CUTOFF, SCHEDULE, computeAttendanceStatus, todayIST, timeIST, nowIST } from '@/lib/attendance'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMsg = params?.error

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  const today = todayIST()

  const { data: todayLog } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', employee.id)
    .eq('work_date', today)
    .single()

  const isClockedIn = todayLog && !todayLog.check_out
  const isDone = todayLog && todayLog.check_out

  const scheduleType = employee.employee_type === 'blue_collar' ? 'blue_collar' : 'white_collar'
  const schedule = SCHEDULE[scheduleType]

  let hoursWorked: string | null = null
  if (todayLog?.check_in) {
    const inTime = new Date(`${today}T${todayLog.check_in}`)
    const outTime = todayLog.check_out ? new Date(`${today}T${todayLog.check_out}`) : nowIST()
    const diffMins = Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / 60000))
    const h = Math.floor(diffMins / 60)
    const m = diffMins % 60
    hoursWorked = m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  async function clockInOut() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!emp) return

    const today = todayIST()
    const timeStr = timeIST()

    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', emp.id)
      .eq('work_date', today)
      .single()

    if (!existing) {
      const { isHalfDay } = computeAttendanceStatus(timeStr, null)
      const { error } = await supabase.from('attendance_logs').insert({
        user_id: emp.id,
        work_date: today,
        check_in: timeStr,
        day_status: isHalfDay ? 'half_day' : 'present',
      })
      if (error) redirect(`/attendance?error=${encodeURIComponent(error.message)}`)
    } else if (!existing.check_out) {
      const { isHalfDay } = computeAttendanceStatus(existing.check_in, timeStr)
      const { error } = await supabase
        .from('attendance_logs')
        .update({
          check_out: timeStr,
          day_status: isHalfDay ? 'half_day' : 'present',
        })
        .eq('id', existing.id)
      if (error) redirect(`/attendance?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/attendance')
  }

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const isHalfDay = todayLog?.day_status === 'half_day'
  const statusLabel = isDone ? (isHalfDay ? 'Half Day' : 'Day Complete') : isClockedIn ? 'Clocked In' : 'Not Clocked In'
  const statusColor = isDone ? 'var(--success)' : isClockedIn ? 'var(--primary)' : 'var(--muted)'
  const statusBg = isDone ? 'var(--success-l)' : isClockedIn ? 'var(--primary-l)' : 'var(--surface2)'

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Attendance' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Time &amp; Attendance
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{todayFormatted}</p>
      </div>

      {errorMsg && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          ⚠️ {errorMsg}
          <p style={{ margin: '0.375rem 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
            If this persists, ask your admin to disable Row Level Security on attendance_logs in Supabase.
          </p>
        </div>
      )}

      {/* Status + times hero card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.75rem 1.5rem',
        marginBottom: '1rem', boxShadow: 'var(--shadow)',
        textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block',
          background: statusBg, color: statusColor,
          border: `1px solid ${statusColor}`,
          borderRadius: '999px', padding: '0.25rem 0.875rem',
          fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.25rem',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{statusLabel}</span>

        {todayLog ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>In</p>
              <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{formatTime(todayLog.check_in)}</p>
            </div>
            {todayLog.check_out ? (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>Out</p>
                <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{formatTime(todayLog.check_out)}</p>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>Duration</p>
                <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{hoursWorked ?? '--'}</p>
              </div>
            )}
            {todayLog.check_out && hoursWorked && (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>Hours</p>
                <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{hoursWorked}</p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: '0 0 1rem' }}>You haven&apos;t clocked in yet today.</p>
        )}

        {isHalfDay && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            background: 'var(--warning-l)', border: '1px solid var(--warning)',
            borderRadius: '999px', padding: '0.25rem 0.875rem',
            color: 'var(--warning)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '1rem',
          }}>
            ⚠️ Half Day
          </div>
        )}
      </div>

      {/* Clock button */}
      <form action={clockInOut} style={{ marginBottom: '1rem' }}>
        <button
          type="submit"
          disabled={!!isDone}
          style={{
            width: '100%', height: '80px',
            background: isDone ? 'var(--success)' : isClockedIn ? '#dc2626' : 'var(--primary)',
            color: '#fff',
            border: 'none', borderRadius: '1rem',
            fontSize: '1.375rem', fontWeight: 800,
            cursor: isDone ? 'default' : 'pointer',
            boxShadow: isDone ? 'none' : '0 4px 20px rgba(124,47,201,0.35)',
            letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
          }}
        >
          {isDone ? (
            <><span style={{ fontSize: '1.25rem' }}>✓</span> Day Complete</>
          ) : isClockedIn ? (
            <><span style={{ fontSize: '1.5rem' }}>◉</span> Clock Out</>
          ) : (
            <><span style={{ fontSize: '1.5rem' }}>◎</span> Clock In</>
          )}
        </button>
      </form>

      {/* Quick link to history */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <Link href="/attendance/history" style={{
          color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500,
        }}>
          View attendance history →
        </Link>
      </div>

      {/* Rules card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.25rem', boxShadow: 'var(--shadow)',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.875rem' }}>
          Half-Day Rules
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--warning-l)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem',
          }}>
            <span style={{ fontSize: '1rem' }}>🕐</span>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
              Arrive after <strong>{HALF_DAY_LATE_CUTOFF}</strong> = half day
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--warning-l)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem',
          }}>
            <span style={{ fontSize: '1rem' }}>🕒</span>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
              Leave before <strong>{HALF_DAY_EARLY_CUTOFF}</strong> = half day
            </p>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.375rem 0 0' }}>
            Schedule: {schedule.days.join(', ')} · {schedule.hours_per_day}h/day ({scheduleType.replace('_', ' ')})
          </p>
        </div>
      </div>
    </div>
  )
}
