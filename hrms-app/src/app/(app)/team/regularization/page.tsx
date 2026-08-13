import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { computeAttendanceStatus } from '@/lib/attendance'

export const dynamic = 'force-dynamic'

export default async function TeamRegularizationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab ?? 'pending'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: requests } = await admin
    .from('attendance_regularizations')
    .select('*, users!employee_id(name, departments(name))')
    .eq('status', tab)
    .order('created_at', { ascending: tab === 'pending' })

  async function approveRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const admin = createAdminClient()

    const id = formData.get('id') as string
    const adminNote = (formData.get('admin_note') as string) || ''

    const { data: req } = await admin
      .from('attendance_regularizations')
      .select('*')
      .eq('id', id)
      .single()

    if (!req) return

    // Fetch existing log for this date
    const { data: log } = await admin
      .from('attendance_logs')
      .select('*')
      .eq('user_id', req.employee_id)
      .eq('work_date', req.work_date)
      .maybeSingle()

    const newCheckIn = req.field === 'check_in' ? req.requested_value : log?.check_in
    const newCheckOut = req.field === 'check_out' ? req.requested_value : log?.check_out

    // Recompute day_status with updated times
    const { dayStatus } = computeAttendanceStatus(newCheckIn ?? null, newCheckOut ?? null, false)

    if (log) {
      await admin
        .from('attendance_logs')
        .update({
          [req.field]: req.requested_value,
          day_status: dayStatus,
        })
        .eq('id', log.id)
    } else {
      await admin.from('attendance_logs').insert({
        user_id: req.employee_id,
        work_date: req.work_date,
        [req.field]: req.requested_value,
        day_status: dayStatus,
      })
    }

    // If attendance is now complete (present), remove ALL auto-generated leaves
    // for this date (both half-day auto leaves and full-day auto-UL from missed checkout)
    if (dayStatus === 'present' || (!dayStatus.includes('half_day') && newCheckIn && newCheckOut)) {
      await admin
        .from('leave_requests')
        .delete()
        .eq('employee_id', req.employee_id)
        .eq('start_date', req.work_date)
        .eq('end_date', req.work_date)
        .eq('status', 'approved')
        .like('reason', 'Auto:%')
    } else if (!dayStatus.includes('half_day')) {
      // Partial correction — only remove half-day auto leaves
      await admin
        .from('leave_requests')
        .delete()
        .eq('employee_id', req.employee_id)
        .eq('start_date', req.work_date)
        .eq('end_date', req.work_date)
        .eq('status', 'approved')
        .eq('is_half_day', true)
        .like('reason', 'Auto:%')
    }

    await admin
      .from('attendance_regularizations')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq('id', id)

    redirect('/team/regularization?tab=pending')
  }

  async function rejectRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const admin = createAdminClient()

    const id = formData.get('id') as string
    const adminNote = (formData.get('admin_note') as string) || ''

    await admin
      .from('attendance_regularizations')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq('id', id)

    redirect('/team/regularization?tab=pending')
  }

  function statusColor(s: string) {
    if (s === 'approved') return 'var(--success)'
    if (s === 'rejected') return 'var(--danger)'
    return 'var(--warning)'
  }

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)', borderRadius: '0.5rem',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
    marginTop: '0.4rem',
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Team', href: '/team' },
          { label: 'Regularization' },
        ]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Attendance Regularization
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Review and approve employee attendance correction requests
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
        {tabs.map(t => (
          <a key={t.key} href={`/team/regularization?tab=${t.key}`} style={{
            padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
            background: tab === t.key ? 'var(--primary)' : 'var(--surface)',
            color: tab === t.key ? '#fff' : 'var(--muted)',
            border: `1px solid ${tab === t.key ? 'var(--primary)' : 'var(--border)'}`,
            textDecoration: 'none',
          }}>{t.label}</a>
        ))}
      </div>

      {!requests || requests.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', padding: '3rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>No {tab} requests</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {(requests as any[]).map(r => {
            const emp = r.users as { name: string; departments: { name: string } | null } | null
            const sc = statusColor(r.status)
            return (
              <div key={r.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0.875rem', padding: '1.25rem',
                boxShadow: 'var(--shadow)',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '1rem' }}>{emp?.name ?? '—'}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.1rem 0 0' }}>
                      {(emp?.departments as { name: string } | null)?.name ?? '—'}
                    </p>
                  </div>
                  <span style={{
                    background: `${sc}18`, color: sc,
                    border: `1px solid ${sc}`,
                    borderRadius: '999px', padding: '0.2rem 0.65rem',
                    fontSize: '0.75rem', fontWeight: 700,
                    textTransform: 'capitalize', whiteSpace: 'nowrap',
                  }}>{r.status}</span>
                </div>

                {/* Details */}
                <div style={{
                  background: 'var(--surface2)', borderRadius: '0.625rem', padding: '0.875rem 1rem',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem',
                  marginBottom: '0.875rem',
                }}>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>Date</p>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0 }}>{r.work_date}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>Correction</p>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      {r.field === 'check_in' ? 'Check-In' : 'Check-Out'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>Current</p>
                    <p style={{ fontWeight: 700, color: 'var(--danger)', margin: 0 }}>{r.current_value ?? '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>Requested</p>
                    <p style={{ fontWeight: 700, color: 'var(--success)', margin: 0 }}>{r.requested_value}</p>
                  </div>
                </div>

                {r.reason && (
                  <p style={{
                    color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic',
                    margin: '0 0 0.875rem', padding: '0.625rem 0.875rem',
                    background: 'var(--surface2)', borderRadius: '0.5rem',
                    borderLeft: '3px solid var(--border)',
                  }}>
                    &ldquo;{r.reason}&rdquo;
                  </p>
                )}

                {r.admin_note && r.status !== 'pending' && (
                  <p style={{
                    color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600,
                    margin: '0 0 0.875rem',
                  }}>
                    Admin note: {r.admin_note}
                  </p>
                )}

                {/* Action buttons — only for pending */}
                {r.status === 'pending' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <form action={approveRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        name="admin_note"
                        type="text"
                        placeholder="Note (optional)"
                        style={inputStyle}
                      />
                      <button
                        type="submit"
                        style={{
                          width: '100%', marginTop: '0.625rem',
                          background: 'var(--success)', color: '#fff',
                          border: 'none', borderRadius: '0.5rem',
                          padding: '0.625rem', fontWeight: 700, fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Approve & Update Attendance
                      </button>
                    </form>
                    <form action={rejectRequest}>
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        name="admin_note"
                        type="text"
                        placeholder="Note (optional)"
                        style={inputStyle}
                      />
                      <button
                        type="submit"
                        style={{
                          width: '100%', marginTop: '0.625rem',
                          background: 'transparent', color: 'var(--danger)',
                          border: '1px solid var(--danger)', borderRadius: '0.5rem',
                          padding: '0.625rem', fontWeight: 700, fontSize: '0.875rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✕ Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
