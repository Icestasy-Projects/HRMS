import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

export default async function TeamLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!employee) redirect('/login')

  if (employee.role !== 'admin' && employee.role !== 'super_admin') redirect('/dashboard')

  // Get relevant employee IDs
  let employeeIds: string[] = []
  if (employee.role === 'admin' && employee.department_id) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('department_id', employee.department_id)
    employeeIds = (data ?? []).map((e: { id: string }) => e.id)
  } else {
    const { data } = await supabase.from('users').select('id')
    employeeIds = (data ?? []).map((e: { id: string }) => e.id)
  }

  // Pending scheduled leave
  const { data: pendingRequests } = employeeIds.length > 0
    ? await supabase
        .from('leave_requests')
        .select('*, employee:employees(id, full_name, department_id, department:departments(name))')
        .eq('status', 'pending')
        .eq('leave_type', 'scheduled')
        .in('employee_id', employeeIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  // Recent unscheduled leave (last 30 days)
  const thirtyDaysAgo = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  const { data: unscheduledRequests } = employeeIds.length > 0
    ? await supabase
        .from('leave_requests')
        .select('*, employee:employees(id, full_name, department_id, department:departments(name))')
        .eq('leave_type', 'unscheduled')
        .eq('status', 'approved')
        .in('employee_id', employeeIds)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
    : { data: [] }

  async function approveLeave(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: approver } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!approver || (approver.role !== 'admin' && approver.role !== 'super_admin')) return

    const requestId = formData.get('request_id') as string
    const { data: req } = await supabase
      .from('leave_requests')
      .select('*, employee:employees(*)')
      .eq('id', requestId)
      .single()
    if (!req) return

    const year = new Date(req.start_date).getFullYear()
    const deduction = req.is_half_day ? 0.5 : req.days_requested

    await supabase
      .from('leave_requests')
      .update({ status: 'approved', approved_by: approver.id, days_deducted: deduction })
      .eq('id', requestId)

    // Deduct from balance
    const { data: bal } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', req.employee_id)
      .eq('year', year)
      .single()
    if (bal) {
      await supabase
        .from('leave_balances')
        .update({
          scheduled_used: bal.scheduled_used + deduction,
          scheduled_balance: Math.max(0, bal.scheduled_balance - deduction),
        })
        .eq('id', bal.id)
    }

    // Notify employee
    await supabase.from('notifications').insert({
      recipient_id: req.employee_id,
      sender_id: approver.id,
      message: `Your scheduled leave request from ${req.start_date} to ${req.end_date} has been approved by ${approver.full_name}.`,
      requires_action: false,
      is_read: false,
      leave_request_id: requestId,
    })

    revalidatePath('/team/leave')
  }

  async function rejectLeave(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: approver } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!approver || (approver.role !== 'admin' && approver.role !== 'super_admin')) return

    const requestId = formData.get('request_id') as string
    const { data: req } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single()
    if (!req) return

    await supabase
      .from('leave_requests')
      .update({ status: 'rejected', approved_by: approver.id })
      .eq('id', requestId)

    await supabase.from('notifications').insert({
      recipient_id: req.employee_id,
      sender_id: approver.id,
      message: `Your scheduled leave request from ${req.start_date} to ${req.end_date} has been rejected by ${approver.full_name}.`,
      requires_action: false,
      is_read: false,
      leave_request_id: requestId,
    })

    revalidatePath('/team/leave')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Leave Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Review leave requests from your team. Scheduled Leave requests need your approval.
          Unscheduled Leave is already recorded — these are just for your awareness.
        </p>
      </div>

      {/* Pending Approval */}
      <section>
        <h2 className="font-semibold text-gray-800 text-base mb-3 flex items-center gap-2">
          Pending Approval
          {pendingRequests && pendingRequests.length > 0 && (
            <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {pendingRequests.length}
            </span>
          )}
        </h2>

        {(!pendingRequests || pendingRequests.length === 0) ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500 text-sm">
            No pending leave requests. You&apos;re all caught up.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">Needs your decision</span>
                    <div className="font-semibold text-gray-900 mt-1">{(req.employee as { full_name?: string })?.full_name ?? 'Unknown'}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(req.start_date), 'd MMM yyyy')}
                      {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), 'd MMM yyyy')}`}
                      {req.is_half_day && ' (half day)'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {req.days_requested} working day{req.days_requested !== 1 ? 's' : ''}
                    </div>
                    {req.reason && (
                      <div className="text-sm text-gray-500 italic mt-1">&ldquo;{req.reason}&rdquo;</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Requested {format(new Date(req.created_at), 'd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <form action={approveLeave}>
                    <input type="hidden" name="request_id" value={req.id} />
                    <button
                      type="submit"
                      className="bg-blue-700 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-blue-800 text-sm min-h-[44px]"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectLeave}>
                    <input type="hidden" name="request_id" value={req.id} />
                    <button
                      type="submit"
                      className="bg-red-700 text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-red-800 text-sm min-h-[44px]"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Unscheduled Leave (FYI) */}
      <section>
        <h2 className="font-semibold text-gray-800 text-base mb-3">Recent Unscheduled Leave <span className="text-gray-400 font-normal text-sm">(last 30 days)</span></h2>
        <p className="text-sm text-gray-500 mb-3">These are already recorded. No action needed from you.</p>

        {(!unscheduledRequests || unscheduledRequests.length === 0) ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500 text-sm">
            No unscheduled leave in the past 30 days.
          </div>
        ) : (
          <div className="space-y-2">
            {unscheduledRequests.map((req) => (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs font-semibold">No action needed</span>
                    <div className="font-medium text-gray-900 mt-1">{(req.employee as { full_name?: string })?.full_name ?? 'Unknown'}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(req.start_date), 'd MMM yyyy')}
                      {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), 'd MMM yyyy')}`}
                      {req.is_half_day && ' (half day)'}
                    </div>
                    {req.reason && (
                      <div className="text-sm text-gray-500 italic mt-1">&ldquo;{req.reason}&rdquo;</div>
                    )}
                  </div>
                  <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium shrink-0">Recorded</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
