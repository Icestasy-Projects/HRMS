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
    .eq('id', user.id)
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
    .eq('user_id', employee.id)
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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const attStatusLabel = todayLog
    ? todayLog.is_half_day ? 'Half Day'
      : todayLog.clock_out ? 'Complete' : 'Clocked In'
    : 'Not clocked in'

  const attBadgeBg = todayLog
    ? todayLog.is_half_day ? '#fef3c7'
      : todayLog.clock_out ? '#dcfce7' : 'var(--primary-l)'
    : 'var(--surface2)'

  const attBadgeColor = todayLog
    ? todayLog.is_half_day ? 'var(--warning)'
      : todayLog.clock_out ? 'var(--success)' : 'var(--primary)'
    : 'var(--muted)'

  const isSuperAdmin = employee.role === 'super_admin'
  type Worklet = { label: string; href: string; icon: string; badge?: number; show?: boolean }
  const worklets: Worklet[] = [
    { label: 'Time & Attendance', href: '/attendance', icon: '◷', show: !isSuperAdmin },
    { label: 'My Leave', href: '/leave', icon: '🌿', show: !isSuperAdmin },
    { label: 'Leave History', href: '/leave/history', icon: '📋', show: !isSuperAdmin },
    { label: 'My Attendance Log', href: '/attendance/history', icon: '📅', show: !isSuperAdmin },
    { label: 'Notifications', href: '/notifications', icon: '🔔', show: true },
    { label: 'Team', href: '/team', icon: '👥', show: isAdmin },
    { label: 'Leave Requests', href: '/team/leave', icon: '✅', badge: pendingLeaveCount > 0 ? pendingLeaveCount : undefined, show: isAdmin },
    { label: 'Manage', href: '/manage', icon: '⚙', show: isSuperAdmin },
  ].filter(w => w.show)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #5b1fa8 0%, #7c2fc9 55%, #9b4de0 100%)',
        borderRadius: '0.75rem',
        padding: '1.75rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            {greeting}, {firstName} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {dayName}, {dateFull}
          </p>
        </div>
        <span style={{
          background: attBadgeBg, color: attBadgeColor,
          borderRadius: '999px', padding: '0.375rem 1rem',
          fontSize: '0.8rem', fontWeight: 700,
          whiteSpace: 'nowrap', alignSelf: 'flex-start',
        }}>
          {attStatusLabel}
          {todayLog && !todayLog.clock_out && ` · ${formatTime(todayLog.clock_in)}`}
        </span>
      </div>

      {/* Worklets grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '0.875rem',
        marginBottom: '1.5rem',
      }}>
        {worklets.map(w => (
          <Link key={w.href} href={w.href} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1.125rem 1rem',
            minHeight: '96px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
            textDecoration: 'none',
            boxShadow: 'var(--shadow)',
            position: 'relative',
          }}>
            <span style={{ fontSize: '28px', lineHeight: 1 }}>{w.icon}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }}>{w.label}</span>
              {w.badge && w.badge > 0 && (
                <span style={{
                  background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 700,
                  borderRadius: '999px', padding: '1px 6px', minWidth: '18px', textAlign: 'center',
                }}>{w.badge}</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {!isSuperAdmin && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>Today</p>
          <p style={{ color: attColor, fontWeight: 700, fontSize: '1rem', margin: 0 }}>{attStatus}</p>
          {todayLog && (
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
              {formatTime(todayLog.clock_in)}{todayLog.clock_out ? ` → ${formatTime(todayLog.clock_out)}` : ' · Active'}
            </p>
          )}
        </div>
        )}

        {!isSuperAdmin && leaveBalance && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>Scheduled Leave</p>
            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>{leaveBalance.sl_remaining}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>days remaining</p>
          </div>
        )}

        {!isSuperAdmin && leaveBalance && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>Sick / Emergency</p>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>{leaveBalance.ul_remaining}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>days remaining</p>
          </div>
        )}

        {isAdmin && (
          <div style={{
            background: pendingLeaveCount > 0 ? 'var(--warning-l)' : 'var(--surface)',
            border: `1px solid ${pendingLeaveCount > 0 ? 'var(--warning)' : 'var(--border)'}`,
            borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>Pending Leaves</p>
            <p style={{ color: pendingLeaveCount > 0 ? 'var(--warning)' : 'var(--text)', fontWeight: 800, fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>{pendingLeaveCount}</p>
            {pendingLeaveCount > 0 ? (
              <Link href="/team/leave" style={{ color: 'var(--warning)', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.25rem', display: 'block' }}>Review now →</Link>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>all clear</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
