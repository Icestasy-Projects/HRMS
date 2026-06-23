import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function LeaveHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!employee) redirect('/login')

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  function statusBadge(status: string) {
    if (status === 'approved') return <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Approved</span>
    if (status === 'pending')  return <span className="bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium">Pending</span>
    if (status === 'rejected') return <span className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium">Rejected</span>
    return <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">{status}</span>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Leave History</h1>
        <p className="text-gray-500 text-sm mt-1">
          All your leave requests, past and present.
        </p>
      </div>

      {(!requests || requests.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No leave requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-gray-900">
                    {req.leave_type === 'scheduled' ? 'Scheduled Leave' : 'Unscheduled Leave'}
                    {req.is_half_day && ' (half day)'}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {format(new Date(req.start_date), 'd MMM yyyy')}
                    {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), 'd MMM yyyy')}`}
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  Days requested: <strong>{req.days_requested}</strong>
                  {req.days_deducted != null && (
                    <span> · Days deducted: <strong>{req.days_deducted}</strong></span>
                  )}
                </div>

                {req.is_half_day && req.days_deducted != null && (
                  <div className="text-gray-500">
                    {req.leave_type === 'scheduled' ? 'Scheduled Leave' : 'Unscheduled Leave'}, half day → {req.days_deducted} day{req.days_deducted !== 1 ? 's' : ''} used
                  </div>
                )}

                {req.reason && (
                  <div className="text-gray-500 italic">&ldquo;{req.reason}&rdquo;</div>
                )}
              </div>

              {req.status === 'pending' && req.leave_type === 'scheduled' && (
                <div className="mt-2 text-xs text-amber-700 font-medium">
                  Waiting for your manager&apos;s approval
                </div>
              )}

              {req.leave_type === 'unscheduled' && req.status === 'approved' && (
                <div className="mt-2 text-xs text-green-700 font-medium">
                  Recorded immediately — your manager was notified
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
