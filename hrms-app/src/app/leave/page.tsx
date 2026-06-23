import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { balanceLabel, carryforwardWarning, unpaidLeaveWarning } from '@/lib/leave'
import { format } from 'date-fns'

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!employee) redirect('/login')

  const year = new Date().getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('year', year)
    .single()

  const { data: recentRequests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const carryWarning = balance ? carryforwardWarning(balance) : null
  const scheduledUnpaidWarning = balance ? unpaidLeaveWarning('scheduled', balance) : null
  const unscheduledUnpaidWarning = balance ? unpaidLeaveWarning('unscheduled', balance) : null

  function statusBadge(status: string) {
    if (status === 'approved') return <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Approved</span>
    if (status === 'pending')  return <span className="bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium">Pending</span>
    if (status === 'rejected') return <span className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium">Rejected</span>
    return <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">{status}</span>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Leave</h1>
        <p className="text-gray-500 text-sm mt-1">
          Request time off here. Scheduled Leave needs manager approval; Unscheduled (sick) Leave is recorded immediately.
        </p>
      </div>

      {/* Warnings */}
      {carryWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium">{carryWarning}</p>
        </div>
      )}
      {scheduledUnpaidWarning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800 font-medium">{scheduledUnpaidWarning}</p>
        </div>
      )}
      {!scheduledUnpaidWarning && unscheduledUnpaidWarning && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800 font-medium">{unscheduledUnpaidWarning}</p>
        </div>
      )}

      {/* Leave balance */}
      {balance ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Your Leave Balance for {year}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-700">{balance.scheduled_balance}</div>
              <div className="text-sm text-blue-800 font-medium mt-1">Scheduled days left</div>
              <div className="text-xs text-blue-600 mt-0.5">out of {balance.scheduled_total} total</div>
              <div className="text-xs text-gray-500 mt-1">{balance.scheduled_used} used this year</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-700">{balance.unscheduled_balance}</div>
              <div className="text-sm text-blue-800 font-medium mt-1">Unscheduled days left</div>
              <div className="text-xs text-blue-600 mt-0.5">out of {balance.unscheduled_total} total</div>
              <div className="text-xs text-gray-500 mt-1">{balance.unscheduled_used} used this year</div>
            </div>
          </div>
          {balance.carried_forward > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Includes {balance.carried_forward} day{balance.carried_forward !== 1 ? 's' : ''} carried forward from last year.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-gray-500 text-sm">Leave balance not found for {year}. Please contact HR.</p>
        </div>
      )}

      {/* Request leave button */}
      <div className="flex gap-3">
        <Link
          href="/leave/request"
          className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 min-h-[44px] flex items-center text-sm"
        >
          Request Leave
        </Link>
        <Link
          href="/leave/history"
          className="bg-gray-100 text-gray-700 rounded-lg px-5 py-3 font-semibold hover:bg-gray-200 min-h-[44px] flex items-center text-sm"
        >
          Full History
        </Link>
      </div>

      {/* Recent requests */}
      {recentRequests && recentRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Leave Requests</h2>
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <div key={req.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {req.leave_type === 'scheduled' ? 'Scheduled Leave' : 'Unscheduled Leave'}
                    {req.is_half_day && ' (half day)'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(req.start_date), 'd MMM')}
                    {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), 'd MMM yyyy')}`}
                    {req.start_date === req.end_date && ` ${format(new Date(req.start_date), 'yyyy')}`}
                  </div>
                </div>
                <div>{statusBadge(req.status)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
