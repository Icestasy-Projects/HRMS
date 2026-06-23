import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LeaveHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!employee) redirect('/login')

  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  function statusColor(status: string) {
    if (status === 'approved') return 'var(--success)'
    if (status === 'pending') return 'var(--warning)'
    if (status === 'rejected') return 'var(--danger)'
    return 'var(--muted)'
  }

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Leave History
      </h1>

      {(!requests || requests.length === 0) ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          No leave requests found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {requests.map(req => {
            const sc = statusColor(req.status)
            return (
              <div
                key={req.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>
                    {req.leave_type} Leave {req.is_half_day ? '(Half Day)' : ''}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    {req.start_date} → {req.end_date} · {req.days_count} day{req.days_count !== 1 ? 's' : ''}
                  </p>
                  {req.reason && (
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                      {req.reason}
                    </p>
                  )}
                </div>
                <span
                  style={{
                    background: `${sc}20`,
                    color: sc,
                    border: `1px solid ${sc}`,
                    borderRadius: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    textTransform: 'capitalize',
                  }}
                >
                  {req.status}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
