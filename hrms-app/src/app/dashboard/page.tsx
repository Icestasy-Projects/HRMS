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
      if (ids.length > 0) {
        query = query.in('employee_id', ids)
      }
    }
    const { count } = await query
    pendingLeaveCount = count ?? 0
  }

  const attStatus = todayLog
    ? todayLog.is_half_day
      ? 'Half Day'
      : todayLog.clock_out
        ? 'Complete'
        : 'Clocked In'
    : 'Not clocked in'

  const attColor = todayLog
    ? todayLog.is_half_day
      ? 'var(--warning)'
      : todayLog.clock_out
        ? 'var(--success)'
        : 'var(--primary)'
    : 'var(--muted)'

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Good morning, {firstName}
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>
          {dayName}, {dateFull}
        </p>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
        {/* Attendance card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.25rem',
          }}
        >
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today
          </p>
          <p style={{ color: attColor, fontWeight: 600, fontSize: '1rem', margin: 0 }}>{attStatus}</p>
          {todayLog && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              In: {formatTime(todayLog.clock_in)} {todayLog.clock_out ? `· Out: ${formatTime(todayLog.clock_out)}` : ''}
            </p>
          )}
        </div>

        {/* Leave balance card */}
        {leaveBalance && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
            }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Leave Balance
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
              {leaveBalance.scheduled_balance} scheduled
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {leaveBalance.unscheduled_balance} sick/emergency
            </p>
          </div>
        )}

        {/* Pending leaves (admin) */}
        {isAdmin && (
          <div
            style={{
              background: 'var(--surface)',
              border: `1px solid ${pendingLeaveCount > 0 ? 'var(--warning)' : 'var(--border)'}`,
              borderRadius: '1rem',
              padding: '1.25rem',
            }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Leaves
            </p>
            <p style={{ color: pendingLeaveCount > 0 ? 'var(--warning)' : 'var(--text)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>
              {pendingLeaveCount} request{pendingLeaveCount !== 1 ? 's' : ''}
            </p>
            {pendingLeaveCount > 0 && (
              <Link href="/team/leave" style={{ color: 'var(--primary-h)', fontSize: '0.85rem', textDecoration: 'none' }}>
                Review →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link
            href="/attendance"
            style={{
              background: 'var(--primary)',
              color: 'var(--text)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.25rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Clock In/Out
          </Link>
          <Link
            href="/leave/request"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.25rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Request Leave
          </Link>
          <Link
            href="/attendance/history"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1.25rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            View Attendance
          </Link>
        </div>
      </div>
    </div>
  )
}
