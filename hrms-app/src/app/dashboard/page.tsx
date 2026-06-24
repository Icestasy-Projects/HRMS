import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/attendance'

export default async function DashboardPage() {
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
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateFull = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const firstName = employee.name.split(' ')[0]

  const { data: todayLog } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .single()

  const { data: leaveBalance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .single()

  const isAdmin = employee.role === 'admin' || employee.role === 'super_admin'

  let pendingLeaveCount = 0
  if (isAdmin) {
    let query = supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (employee.role === 'admin' && employee.department_id) {
      const { data: deptUsers } = await supabase
        .from('users')
        .select('id')
        .eq('department_id', employee.department_id)
      const ids = deptUsers?.map(u => u.id) ?? []
      if (ids.length > 0) query = query.in('employee_id', ids)
    }
    const { count } = await query
    pendingLeaveCount = count ?? 0
  }

  const attStatus = todayLog
    ? todayLog.is_half_day ? 'Half Day'
      : todayLog.clock_out ? 'Completed' : 'Clocked In'
    : 'Not Clocked In'

  const attColor = todayLog
    ? todayLog.is_half_day ? 'var(--warning)'
      : todayLog.clock_out ? 'var(--success)' : 'var(--primary)'
    : 'var(--muted)'

  const attBg = todayLog
    ? todayLog.is_half_day ? 'var(--warning-l)'
      : todayLog.clock_out ? 'var(--success-l)' : 'var(--primary-l)'
    : 'var(--surface2)'

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          {dayName}, {dateFull}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.75rem' }}>

        {/* Today attendance */}
        <div style={{
          background: attBg,
          border: `1px solid ${attColor}40`,
          borderRadius: '1.125rem',
          padding: '1.25rem',
          boxShadow: 'var(--shadow)',
        }}>
          <p style={{ color: attColor, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, marginBottom: '0.75rem' }}>
            Today
          </p>
          <p style={{ color: attColor, fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>{attStatus}</p>
          {todayLog && (
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
              {formatTime(todayLog.clock_in)}{todayLog.clock_out ? ` → ${formatTime(todayLog.clock_out)}` : ' · Active'}
            </p>
          )}
          {!todayLog && (
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>Tap Clock In/Out to start</p>
          )}
        </div>

        {/* Scheduled leave */}
        {leaveBalance && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1.125rem',
            padding: '1.25rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, marginBottom: '0.75rem' }}>
              Scheduled Leave
            </p>
            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>
              {leaveBalance.scheduled_balance}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>days remaining</p>
          </div>
        )}

        {/* Unscheduled leave */}
        {leaveBalance && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1.125rem',
            padding: '1.25rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, marginBottom: '0.75rem' }}>
              Sick / Emergency
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>
              {leaveBalance.unscheduled_balance}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>days remaining</p>
          </div>
        )}

        {/* Pending leaves (admin) */}
        {isAdmin && (
          <div style={{
            background: pendingLeaveCount > 0 ? 'var(--warning-l)' : 'var(--surface)',
            border: `1px solid ${pendingLeaveCount > 0 ? 'var(--warning)' : 'var(--border)'}`,
            borderRadius: '1.125rem',
            padding: '1.25rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, marginBottom: '0.75rem' }}>
              Pending Leaves
            </p>
            <p style={{ color: pendingLeaveCount > 0 ? 'var(--warning)' : 'var(--text)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>
              {pendingLeaveCount}
            </p>
            {pendingLeaveCount > 0 ? (
              <Link href="/team/leave" style={{ color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.375rem', display: 'block' }}>
                Review now →
              </Link>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>all clear</p>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '1.125rem',
        padding: '1.25rem',
        boxShadow: 'var(--shadow)',
      }}>
        <h2 style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          <Link href="/attendance" style={{
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            ◷ Clock In / Out
          </Link>
          <Link href="/leave/request" style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            🌿 Request Leave
          </Link>
          <Link href="/attendance/history" style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}>
            📅 My Attendance
          </Link>
          {isAdmin && (
            <Link href="/team/leave" style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              📋 Leave Requests
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
