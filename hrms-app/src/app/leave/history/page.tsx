import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function LeaveHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
  if (!employee) redirect('/login')

  const { data: requests } = await supabase
    .from('leave_requests').select('*').eq('employee_id', employee.id).order('created_at', { ascending: false })

  function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, { bg: string; color: string }> = {
      approved: { bg: 'rgba(34,197,94,0.15)', color: 'var(--success)' },
      pending:  { bg: 'rgba(245,158,11,0.15)', color: 'var(--warning)' },
      rejected: { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)' },
    }
    const s = styles[status] ?? { bg: 'var(--surface2)', color: 'var(--muted)' }
    return <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: s.bg, color: s.color }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Leave History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>All your leave requests, past and present.</p>
      </div>

      {(!requests || requests.length === 0) ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No leave requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {req.leave_type === 'scheduled' ? 'Scheduled Leave' : 'Unscheduled Leave'}
                    {req.is_half_day && ' (half day)'}
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                    {format(new Date(req.start_date), 'd MMM yyyy')}
                    {req.start_date !== req.end_date && ` – ${format(new Date(req.end_date), 'd MMM yyyy')}`}
                  </div>
                </div>
                <StatusBadge status={req.status} />
              </div>
              <div className="text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                <div>Days: <strong style={{ color: 'var(--text)' }}>{req.days_requested}</strong>
                  {req.days_deducted != null && <span> · Deducted: <strong style={{ color: 'var(--text)' }}>{req.days_deducted}</strong></span>}
                </div>
                {req.reason && <div className="italic">&ldquo;{req.reason}&rdquo;</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
