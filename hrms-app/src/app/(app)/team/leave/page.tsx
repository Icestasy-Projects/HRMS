import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeamLeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!employee || (employee.role !== 'admin' && employee.role !== 'super_admin')) {
    redirect('/dashboard')
  }

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

  const { data: allRequests, error: fetchError } = empIds.length > 0
    ? await supabase
        .from('leave_requests')
        .select('*, employee:users!leave_requests_employee_id_fkey(name, email)')
        .in('employee_id', empIds)
        .order('requested_at', { ascending: false })
    : { data: [], error: null }

  const pending = allRequests?.filter(r => r.status === 'pending' && r.leave_type === 'SL') ?? []
  const others = allRequests?.filter(r => !(r.status === 'pending' && r.leave_type === 'SL')) ?? []

  async function approveLeave(formData: FormData) {
    'use server'
    const requestId = formData.get('request_id') as string
    const supabase = await createClient()

    const { data: req } = await supabase.from('leave_requests').select('*').eq('id', requestId).single()
    if (!req) return

    await supabase.from('leave_requests').update({ status: 'approved' }).eq('id', requestId)

    const { data: bal } = await supabase.from('leave_balances').select('*').eq('user_id', req.employee_id).single()
    if (bal) {
      await supabase.from('leave_balances').update({ sl_used: bal.sl_used + req.days_count }).eq('user_id', req.employee_id)
    }

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

    const { data: req } = await supabase.from('leave_requests').select('*').eq('id', requestId).single()
    if (!req) return

    await supabase.from('leave_requests').update({ status: 'rejected' }).eq('id', requestId)

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

  function typeLabel(type: string) {
    if (type === 'UL') return 'Unscheduled'
    if (type === 'SL') return 'Scheduled'
    return type
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Leave Requests' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Leave Requests
        </h1>
        {pending.length > 0 && (
          <p style={{ color: 'var(--warning)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>
            {pending.length} request{pending.length !== 1 ? 's' : ''} need{pending.length === 1 ? 's' : ''} your decision
          </p>
        )}
      </div>

      {fetchError && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          ⚠️ Could not load requests: {fetchError.message}
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
            Run in Supabase SQL Editor: <code>ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;</code>
          </p>
        </div>
      )}

      {/* Needs decision */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
          <h2 style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)', margin: 0,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Needs Your Decision
          </h2>
          {pending.length > 0 && (
            <span style={{
              background: 'var(--warning)', color: '#fff',
              borderRadius: '999px', padding: '0.1rem 0.5rem',
              fontSize: '0.72rem', fontWeight: 700,
            }}>{pending.length}</span>
          )}
        </div>

        {pending.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            color: 'var(--muted)', fontSize: '0.9rem', boxShadow: 'var(--shadow)',
          }}>
            <span style={{ fontSize: '1.25rem' }}>✓</span>
            No pending requests — all clear
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map(req => (
              <div key={req.id} style={{
                background: 'var(--surface)', border: '1px solid var(--warning)',
                borderRadius: '0.875rem', padding: '1.25rem',
                boxShadow: 'var(--shadow)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--primary-l)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary)', fontWeight: 700, fontSize: '12px',
                      }}>
                        {req.employee?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{req.employee?.name}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: 0 }}>{req.employee?.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: req.reason ? '0.5rem' : 0 }}>
                      <span style={{
                        background: 'var(--primary-l)', color: 'var(--primary)',
                        borderRadius: '999px', padding: '0.2rem 0.625rem',
                        fontSize: '0.72rem', fontWeight: 600,
                      }}>{typeLabel(req.leave_type)}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                        {req.start_date} → {req.end_date}
                      </span>
                      <span style={{
                        background: 'var(--surface2)', borderRadius: '999px', padding: '0.2rem 0.625rem',
                        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text)',
                      }}>
                        {req.days_count} day{req.days_count !== 1 ? 's' : ''}{req.is_half_day ? ' (Half)' : ''}
                      </span>
                    </div>
                    {req.reason && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexDirection: 'column' }}>
                    <form action={approveLeave}>
                      <input type="hidden" name="request_id" value={req.id} />
                      <button type="submit" style={{
                        width: '100%',
                        background: 'var(--success)', color: '#fff',
                        border: 'none', borderRadius: '0.625rem',
                        padding: '0.625rem 1.25rem', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.875rem', minHeight: '44px',
                        whiteSpace: 'nowrap',
                      }}>
                        ✓ Approve
                      </button>
                    </form>
                    <form action={rejectLeave}>
                      <input type="hidden" name="request_id" value={req.id} />
                      <button type="submit" style={{
                        width: '100%',
                        background: 'transparent', border: '1px solid var(--danger)',
                        color: 'var(--danger)', borderRadius: '0.625rem',
                        padding: '0.625rem 1.25rem', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.875rem', minHeight: '44px',
                        whiteSpace: 'nowrap',
                      }}>
                        ✕ Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {others.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', marginBottom: '0.875rem',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            All Requests
          </h2>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
          }}>
            {others.map((req, idx) => {
              const sc = statusColor(req.status)
              return (
                <div key={req.id} style={{
                  padding: '0.875rem 1.25rem',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{req.employee?.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.2rem 0 0', textTransform: 'capitalize' }}>
                      {typeLabel(req.leave_type)} · {req.start_date} → {req.end_date} · {req.days_count} day{req.days_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span style={{
                    background: `${sc}18`, color: sc, border: `1px solid ${sc}`,
                    borderRadius: '999px', padding: '0.25rem 0.75rem',
                    fontSize: '0.72rem', fontWeight: 600,
                    whiteSpace: 'nowrap', textTransform: 'capitalize', flexShrink: 0,
                  }}>
                    {req.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
