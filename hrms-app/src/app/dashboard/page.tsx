import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatTime } from '@/lib/attendance'
import { balanceLabel } from '@/lib/leave'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  // Today's attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .single()

  // Leave balance for current year
  const year = new Date().getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('year', year)
    .single()

  // Pending leave requests (for admin/super_admin)
  let pendingCount = 0
  if (employee.role === 'admin' || employee.role === 'super_admin') {
    const query = supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('leave_type', 'scheduled')

    if (employee.role === 'admin' && employee.department_id) {
      // Get employees in same department
      const { data: deptEmployees } = await supabase
        .from('employees')
        .select('id')
        .eq('department_id', employee.department_id)
      const ids = (deptEmployees ?? []).map((e: { id: string }) => e.id)
      if (ids.length > 0) {
        const { count } = await query.in('employee_id', ids)
        pendingCount = count ?? 0
      }
    } else {
      const { count } = await query
      pendingCount = count ?? 0
    }
  }

  const clockedIn = attendance?.clock_in && !attendance?.clock_out
  const clockedOut = attendance?.clock_in && attendance?.clock_out

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Page description */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your daily overview — attendance, leave, and what needs your attention today.
        </p>
      </div>

      {/* Today's attendance status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Today&apos;s Attendance</h2>
          <span className="text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</span>
        </div>

        {!attendance && (
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">Not clocked in</span>
            <span className="text-sm text-gray-500">You haven&apos;t clocked in today yet.</span>
          </div>
        )}

        {clockedIn && (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Clocked in</span>
              <span className="text-sm text-gray-700">Since {formatTime(attendance.clock_in)}</span>
            </div>
            {attendance.is_half_day && (
              <p className="text-sm text-amber-700 font-medium">Half day recorded (arrived after 13:30)</p>
            )}
          </div>
        )}

        {clockedOut && (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={attendance.is_half_day ? 'bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium' : 'bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium'}>
                {attendance.is_half_day ? 'Half day' : 'Full day'}
              </span>
              <span className="text-sm text-gray-700">
                {formatTime(attendance.clock_in)} – {formatTime(attendance.clock_out)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Leave balance */}
      {balance && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Your Leave Balance</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-700">{balance.scheduled_balance}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {balanceLabel(balance.scheduled_balance, balance.scheduled_total, 'scheduled')}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700">{balance.unscheduled_balance}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {balanceLabel(balance.unscheduled_balance, balance.unscheduled_total, 'unscheduled')}
              </div>
            </div>
          </div>
          {balance.scheduled_balance === 0 && (
            <p className="text-sm text-red-700 font-medium mt-3">
              You&apos;ve used all your leave. Any more time off will be deducted from your pay at 1.5× the daily rate.
            </p>
          )}
        </div>
      )}

      {/* Pending leave requests (admin) */}
      {(employee.role === 'admin' || employee.role === 'super_admin') && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-amber-900">Leave Requests Awaiting Your Decision</h2>
              <p className="text-amber-700 text-sm mt-1">
                {pendingCount} scheduled leave request{pendingCount !== 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your approval.
              </p>
            </div>
            <Link
              href="/team/leave"
              className="bg-amber-700 text-white rounded-lg px-4 py-2.5 font-semibold text-sm hover:bg-amber-800 min-h-[44px] flex items-center"
            >
              Review
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/attendance"
            className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 min-h-[44px] flex items-center text-sm"
          >
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </Link>
          <Link
            href="/leave/request"
            className="bg-gray-100 text-gray-700 rounded-lg px-5 py-3 font-semibold hover:bg-gray-200 min-h-[44px] flex items-center text-sm"
          >
            Request Leave
          </Link>
          <Link
            href="/attendance/history"
            className="bg-gray-100 text-gray-700 rounded-lg px-5 py-3 font-semibold hover:bg-gray-200 min-h-[44px] flex items-center text-sm"
          >
            View History
          </Link>
        </div>
      </div>
    </div>
  )
}
