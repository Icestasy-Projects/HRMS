import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function TeamSeparationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: employees } = await admin
    .from('users')
    .select('id, name, departments(name)')
    .eq('is_active', true)
    .order('name')

  const { data: requests, error: sepError } = await admin
    .from('separation_requests')
    .select('*, users!employee_id(name, email, departments(name))')
    .order('created_at', { ascending: false })

  if (sepError && sepError.code === '42P01') {
    return (
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Separation Requests' }]} />
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.875rem', padding: '1.5rem', marginTop: '1rem' }}>
          <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 0.5rem' }}>Setup required</p>
          <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
            The <code>separation_requests</code> table has not been created yet. Please run the setup SQL in your Supabase SQL Editor, then reload.
          </p>
        </div>
      </div>
    )
  }

  async function markSeparation(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const admin = createAdminClient()
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return

    const employeeId = formData.get('employee_id') as string
    const type = formData.get('type') as string
    const reason = formData.get('reason') as string
    const sabbaticalFrom = formData.get('sabbatical_from') as string | null
    const sabbaticalTo = formData.get('sabbatical_to') as string | null
    const resignationDate = formData.get('resignation_date') as string | null

    await admin.from('separation_requests').insert({
      employee_id: employeeId,
      type,
      reason: reason || null,
      sabbatical_from: type === 'sabbatical' && sabbaticalFrom ? sabbaticalFrom : (type === 'resignation' && resignationDate ? resignationDate : null),
      sabbatical_to: type === 'sabbatical' && sabbaticalTo ? sabbaticalTo : null,
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })

    redirect('/team/separation')
  }

  async function revokeSeparation(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const admin = createAdminClient()
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return

    const id = formData.get('id') as string
    await admin.from('separation_requests').delete().eq('id', id)
    redirect('/team/separation')
  }

  async function approveRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const id = formData.get('id') as string
    const noticePeriodDays = formData.get('notice_period_days') as string | null

    await admin.from('separation_requests').update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notice_period_days: noticePeriodDays ? Number(noticePeriodDays) : null,
    }).eq('id', id)

    redirect('/team/separation')
  }

  async function rejectRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const id = formData.get('id') as string
    const rejectionReason = formData.get('rejection_reason') as string | null

    await admin.from('separation_requests').update({
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    }).eq('id', id)

    redirect('/team/separation')
  }

  const statusColor: Record<string, string> = {
    pending: 'var(--warning)',
    approved: 'var(--success)',
    rejected: 'var(--danger)',
  }
  const statusBg: Record<string, string> = {
    pending: 'var(--warning-l)',
    approved: 'var(--success-l)',
    rejected: 'var(--danger-l)',
  }

  const pending = requests?.filter(r => r.status === 'pending') ?? []
  const resolved = requests?.filter(r => r.status !== 'pending') ?? []

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Separation Requests' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Separation Requests
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Approve or reject resignation and sabbatical requests
        </p>
      </div>

      {/* Manual mark form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.875rem', padding: '1.25rem 1.5rem',
        boxShadow: 'var(--shadow)', marginBottom: '2rem',
      }}>
        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Mark Employee Separation
        </p>
        <form action={markSeparation} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Employee</label>
              <select name="employee_id" required style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem' }}>
                <option value="">Select employee…</option>
                {(employees ?? []).map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{(emp.departments as unknown as { name: string } | null)?.name ? ` — ${(emp.departments as unknown as { name: string }).name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Type</label>
              <select
                name="type"
                required
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem' }}
                {...{ onChange: "var r=document.getElementById('sep-resignation-fields'),s=document.getElementById('sep-sabbatical-fields');if(this.value==='resignation'){r.style.display='block';s.style.display='none'}else{r.style.display='none';s.style.display='grid'}" } as any}
              >
                <option value="resignation">Resignation</option>
                <option value="sabbatical">Sabbatical</option>
              </select>
            </div>
          </div>

          {/* Resignation date — shown for resignation */}
          <div id="sep-resignation-fields" style={{ display: 'block' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Last Working Day</label>
            <input type="date" name="resignation_date" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>

          {/* Sabbatical dates — shown for sabbatical */}
          <div id="sep-sabbatical-fields" style={{ display: 'none', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Sabbatical From</label>
              <input type="date" name="sabbatical_from" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Sabbatical To</label>
              <input type="date" name="sabbatical_to" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Reason / Note (optional)</label>
            <input type="text" name="reason" placeholder="e.g. Voluntary resignation, medical sabbatical…" style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--surface2)', color: 'var(--text)', fontSize: '0.875rem', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ alignSelf: 'flex-start', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
            Mark as Separated
          </button>
        </form>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Pending — {pending.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.map((req: any) => (
              <div key={req.id} style={{
                background: 'var(--surface)', border: '1px solid var(--warning)',
                borderRadius: '0.875rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.125rem 1.25rem', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>
                      {req.users?.name ?? 'Unknown'}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                      {req.users?.email} {req.users?.departments?.name ? `· ${req.users.departments.name}` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: req.type === 'resignation' ? '#fee2e2' : '#e0f2fe',
                        color: req.type === 'resignation' ? '#991b1b' : '#075985',
                        borderRadius: '999px', padding: '0.2rem 0.625rem',
                        fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
                      }}>
                        {req.type === 'resignation' ? 'Resignation' : 'Sabbatical'}
                      </span>
                      {req.type === 'sabbatical' && req.sabbatical_from && (
                        <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                          {req.sabbatical_from} → {req.sabbatical_to}
                        </span>
                      )}
                    </div>
                    {req.reason && (
                      <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.5rem 0 0', fontStyle: 'italic' }}>
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    )}
                    <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '0.375rem 0 0' }}>
                      Submitted {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{
                    background: 'var(--warning)', color: '#fff',
                    borderRadius: '999px', padding: '0.25rem 0.875rem',
                    fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                  }}>Pending</span>
                </div>

                {/* Action bar */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 1.25rem', background: 'var(--surface2)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {/* Approve form */}
                  <form action={approveRequest} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', flex: 1 }}>
                    <input type="hidden" name="id" value={req.id} />
                    {req.type === 'resignation' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Notice Period (days)
                        </label>
                        <input
                          type="number"
                          name="notice_period_days"
                          placeholder="e.g. 30"
                          min="0"
                          style={{
                            padding: '0.5rem 0.75rem', border: '1px solid var(--border)',
                            borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)',
                            fontSize: '0.875rem', width: '120px',
                          }}
                        />
                      </div>
                    )}
                    <button type="submit" style={{
                      background: 'var(--success)', color: '#fff', border: 'none',
                      borderRadius: '0.5rem', padding: '0.5rem 1.25rem',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    }}>
                      Approve
                    </button>
                  </form>

                  {/* Reject form */}
                  <form action={rejectRequest} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <input type="hidden" name="id" value={req.id} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Rejection reason (optional)
                      </label>
                      <input
                        type="text"
                        name="rejection_reason"
                        placeholder="Reason..."
                        style={{
                          padding: '0.5rem 0.75rem', border: '1px solid var(--border)',
                          borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)',
                          fontSize: '0.875rem', width: '200px',
                        }}
                      />
                    </div>
                    <button type="submit" style={{
                      background: 'transparent', border: '1px solid var(--danger)',
                      color: 'var(--danger)', borderRadius: '0.5rem', padding: '0.5rem 1.25rem',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                    }}>
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Resolved — {resolved.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resolved.map((req: any) => (
              <div key={req.id} style={{
                background: statusBg[req.status] ?? 'var(--surface)',
                border: `1px solid ${statusColor[req.status] ?? 'var(--border)'}`,
                borderRadius: '0.875rem', padding: '1rem 1.25rem', boxShadow: 'var(--shadow)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', margin: 0 }}>
                      {req.users?.name ?? 'Unknown'}
                      <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.8rem' }}>
                        {' '}— {req.type === 'resignation' ? 'Resignation' : 'Sabbatical'}
                      </span>
                    </p>
                    {req.status === 'approved' && req.type === 'resignation' && req.sabbatical_from && (
                      <p style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
                        Last working day: {req.sabbatical_from}
                      </p>
                    )}
                    {req.status === 'approved' && req.notice_period_days && (
                      <p style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
                        Notice: {req.notice_period_days} days
                      </p>
                    )}
                    {req.status === 'rejected' && req.rejection_reason && (
                      <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                        {req.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    <span style={{
                      background: statusColor[req.status], color: '#fff',
                      borderRadius: '999px', padding: '0.2rem 0.75rem',
                      fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap',
                    }}>
                      {req.status}
                    </span>
                    {req.status === 'approved' && (
                      <form action={revokeSeparation}>
                        <input type="hidden" name="id" value={req.id} />
                        <button type="submit" style={{
                          background: 'transparent', border: '1px solid var(--muted)',
                          color: 'var(--muted)', borderRadius: '0.5rem',
                          padding: '0.2rem 0.625rem', fontSize: '0.72rem',
                          fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                          Revoke
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!requests || requests.length === 0) && (
        <div style={{
          textAlign: 'center', padding: '3rem', color: 'var(--muted)',
          background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>No separation requests</p>
          <p style={{ fontSize: '0.875rem' }}>All clear — no pending or past requests</p>
        </div>
      )}
    </div>
  )
}
