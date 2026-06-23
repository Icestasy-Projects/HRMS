import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/attendance'
import { balanceLabel } from '@/lib/leave'
import { format } from 'date-fns'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {children}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
  if (!employee) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const year = new Date().getFullYear()

  const [{ data: attendance }, { data: balance }] = await Promise.all([
    supabase.from('attendance_logs').select('*').eq('employee_id', employee.id).eq('date', today).maybeSingle(),
    supabase.from('leave_balances').select('*').eq('employee_id', employee.id).eq('year', year).single(),
  ])

  let pendingCount = 0
  if (employee.role === 'admin' || employee.role === 'super_admin') {
    const query = supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('leave_type', 'scheduled')
    if (employee.role === 'admin' && employee.department_id) {
      const { data: deptEmps } = await supabase.from('users').select('id').eq('department_id', employee.department_id)
      const ids = (deptEmps ?? []).map((e: { id: string }) => e.id)
      if (ids.length > 0) { const { count } = await query.in('employee_id', ids); pendingCount = count ?? 0 }
    } else { const { count } = await query; pendingCount = count ?? 0 }
  }

  const clockedIn = attendance?.clock_in && !attendance?.clock_out
  const clockedOut = attendance?.clock_in && attendance?.clock_out

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {employee.name.split(' ')[0]}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Attendance card */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Today&apos;s Attendance</h2>
        </div>
        {!attendance && (
          <div className="flex items-center gap-3">
            <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Not clocked in</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>You haven&apos;t clocked in yet.</span>
          </div>
        )}
        {clockedIn && (
          <div className="flex items-center gap-3">
            <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--success)' }}>Clocked in</span>
            <span className="text-sm" style={{ color: 'var(--text)' }}>Since {formatTime(attendance.clock_in)}</span>
            {attendance.is_half_day && <span className="text-sm font-medium" style={{ color: 'var(--warning)' }}>Half day</span>}
          </div>
        )}
        {clockedOut && (
          <div className="flex items-center gap-3">
            <span className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ background: attendance.is_half_day ? 'rgba(245,158,11,0.15)' : 'rgba(139,47,201,0.2)', color: attendance.is_half_day ? 'var(--warning)' : 'var(--primary-h)' }}>
              {attendance.is_half_day ? 'Half day' : 'Full day'}
            </span>
            <span className="text-sm" style={{ color: 'var(--text)' }}>{formatTime(attendance.clock_in)} – {formatTime(attendance.clock_out)}</span>
          </div>
        )}
      </Card>

      {/* Leave balance */}
      {balance && (
        <Card>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Leave Balance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-h)' }}>{balance.scheduled_balance}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{balanceLabel(balance.scheduled_balance, balance.scheduled_total, 'scheduled')}</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-h)' }}>{balance.unscheduled_balance}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{balanceLabel(balance.unscheduled_balance, balance.unscheduled_total, 'unscheduled')}</div>
            </div>
          </div>
          {balance.scheduled_balance === 0 && (
            <p className="text-sm font-medium mt-3 rounded-lg px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
              No leave balance remaining — further time off will be deducted at 1.5× daily pay.
            </p>
          )}
        </Card>
      )}

      {/* Pending for admin */}
      {(employee.role === 'admin' || employee.role === 'super_admin') && pendingCount > 0 && (
        <div className="rounded-2xl border p-5 flex items-center justify-between"
          style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--warning)' }}>Leave Requests Awaiting Decision</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{pendingCount} request{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your approval</p>
          </div>
          <Link href="/team/leave" className="rounded-xl px-4 py-2.5 font-semibold text-sm flex items-center"
            style={{ background: 'var(--warning)', color: '#000', minHeight: '44px' }}>Review</Link>
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/attendance" className="rounded-xl px-5 py-3 font-semibold text-sm flex items-center"
            style={{ background: 'var(--primary)', color: '#fff', minHeight: '44px' }}>
            {clockedIn ? '⏹ Clock Out' : '▶ Clock In'}
          </Link>
          <Link href="/leave/request" className="rounded-xl px-5 py-3 font-semibold text-sm flex items-center"
            style={{ background: 'var(--surface2)', color: 'var(--text)', minHeight: '44px' }}>Request Leave</Link>
          <Link href="/attendance/history" className="rounded-xl px-5 py-3 font-semibold text-sm flex items-center"
            style={{ background: 'var(--surface2)', color: 'var(--text)', minHeight: '44px' }}>View History</Link>
        </div>
      </Card>
    </div>
  )
}
