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

  const { data: requests, error: fetchError } = await supabase
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
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>Home / Leave / History</p>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Leave History
        </h1>
      </div>

      {fetchError && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          ⚠️ Could not load history: {fetchError.message}
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
            Ask your admin to disable Row Level Security on leave_requests in Supabase.
          </p>
        </div>
      )}

      {(!requests || requests.length === 0) ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No leave requests found</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Your leave history will appear here.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
        }}>
          {requests.map((req, idx) => {
            const sc = statusColor(req.status)
            return (
              <div
                key={req.id}
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: '1rem',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
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
                <span style={{
                  background: `${sc}18`, color: sc,
                  border: `1px solid ${sc}`,
                  borderRadius: '999px', padding: '0.25rem 0.75rem',
                  fontSize: '0.78rem', fontWeight: 600,
                  whiteSpace: 'nowrap', textTransform: 'capitalize',
                }}>
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
