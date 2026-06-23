import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeamLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!employee || (employee.role !== 'admin' && employee.role !== 'super_admin')) {
    redirect('/dashboard')
  }

  // Get relevant employee IDs
  let empIds: string[] = []
  if (employee.role === 'admin' && employee.department_id) {
    const { data: deptUsers } = await supabase
      .from('users')
      .select('id')
      .eq('department_id', employee.department_id)
    empIds = deptUsers?.map(u => u.id) ?? []
  } else {
    const { data: allUsers } = await supabase.from('users').select('id')
    empIds = allUsers?.map(u => u.id) ?? []
  }

  const { data: allRequests } = empIds.length > 0
    ? await supabase
        .from('leave_requests')
        .select('*, users(name, email)')
        .in('employee_id', empIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const pending = allRequests?.filter(r => r.status === 'pending' && r.leave_type === 'scheduled') ?? []
  const others = allRequests?.filter(r => !(r.status === 'pending' && r.leave_type === 'scheduled')) ?? []

  async function approveLeave(formData: FormData) {
    'use server'
    const requestId = formData.get('request_id') as string
    const supabase = await createClient()

    const { data: req } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!req) return

    await supabase
      .from('leave_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)

    // Deduct balance
    const { data: bal } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', req.employee_id)
      .single()

    if (bal) {
      await supabase
        .from('leave_balances')
        .update({ scheduled_balance: bal.scheduled_balance - req.days_count })
        .eq('employee_id', req.employee_id)
    }

    // Notify employee
    await supabase.from('notifications').insert({
      recipient_id: req.employee_id,
      type: 'fyi',
      title: 'Leave Approved',
      message: `Your leave request from ${req.start_date} to ${req.end_date} has been approved.`,
      related_id: requestId,
    })

    redirect('/team/leave')
  }

  async function rejectLeave(formData: FormData) {
    'use server'
    const requestId = formData.get('request_id') as string
    const supabase = await createClient()

    const { data: req } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!req) return

    await supabase
      .from('leave_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    await supabase.from('notifications').insert({
      recipient_id: req.employee_id,
      type: 'fyi',
      title: 'Leave Rejected',
      message: `Your leave request from ${req.start_date} to ${req.end_date} has been rejected.`,
      related_id: requestId,
    })

    redirect('/team/leave')
  }

  function statusColor(status: string) {
    if (status === 'approved') return 'var(--success)'
    if (status === 'pending') return 'var(--warning)'
    if (status === 'rejected') return 'var(--danger)'
    return 'var(--muted)'
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Leave Requests
      </h1>

      {/* Needs decision */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--warning)', margin: 0 }}>
            Needs Your Decision
          </h2>
          {pending.length > 0 && (
            <span
              style={{
                background: 'rgba(245,158,11,0.2)',
                color: 'var(--warning)',
                borderRadius: '999px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
              color: 'var(--muted)',
              fontSize: '0.9rem',
            }}
          >
            No pending requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {pending.map(req => (
              <div
                key={req.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--warning)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>
                      {req.users?.name}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                      {req.start_date} → {req.end_date} · {req.days_count} day{req.days_count !== 1 ? 's' : ''}
                      {req.is_half_day ? ' (Half Day)' : ''}
                    </p>
                    {req.reason && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                        {req.reason}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <form action={approveLeave}>
                      <input type="hidden" name="request_id" value={req.id} />
                      <button
                        type="submit"
                        style={{
                          background: 'rgba(34,197,94,0.15)',
                          border: '1px solid var(--success)',
                          color: 'var(--success)',
                          borderRadius: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          minHeight: '44px',
                        }}
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectLeave}>
                      <input type="hidden" name="request_id" value={req.id} />
                      <button
                        type="submit"
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid var(--danger)',
                          color: 'var(--danger)',
                          borderRadius: '0.5rem',
                          padding: '0.375rem 0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          minHeight: '44px',
                        }}
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No action needed */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '0.75rem' }}>
          No Action Needed
        </h2>
        {others.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
              color: 'var(--muted)',
              fontSize: '0.9rem',
            }}
          >
            No other requests.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {others.map(req => {
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
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>
                      {req.users?.name}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
                      {req.leave_type} · {req.start_date} → {req.end_date} · {req.days_count} day{req.days_count !== 1 ? 's' : ''}
                    </p>
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
                      flexShrink: 0,
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
    </div>
  )
}
