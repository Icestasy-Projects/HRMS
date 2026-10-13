import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import RegularizationActions from '@/components/RegularizationActions'
import { computeAttendanceStatus } from '@/lib/attendance'
import { logAudit } from '@/lib/audit'

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

  const { count: pendingCount } = await admin
    .from('attendance_regularizations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

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

    const { data: log } = await admin
      .from('attendance_logs')
      .select('*')
      .eq('user_id', req.employee_id)
      .eq('work_date', req.work_date)
      .maybeSingle()

    const newCheckIn = req.field === 'check_in' ? req.requested_value : log?.check_in
    const newCheckOut = req.field === 'check_out' ? req.requested_value : log?.check_out

    const { dayStatus } = computeAttendanceStatus(newCheckIn ?? null, newCheckOut ?? null, false)

    if (log) {
      const { error: logErr } = await admin
        .from('attendance_logs')
        .update({
          [req.field]: req.requested_value,
          day_status: dayStatus,
        })
        .eq('id', log.id)
      if (logErr) redirect(`/team/regularization?tab=pending&error=${encodeURIComponent('Failed to update attendance log: ' + logErr.message)}`)
    } else {
      const { error: logErr } = await admin.from('attendance_logs').insert({
        user_id: req.employee_id,
        work_date: req.work_date,
        [req.field]: req.requested_value,
        day_status: dayStatus,
      })
      if (logErr) redirect(`/team/regularization?tab=pending&error=${encodeURIComponent('Failed to create attendance log: ' + logErr.message)}`)
    }

    if (dayStatus === 'present' || (!dayStatus.includes('half_day') && newCheckIn && newCheckOut)) {
      const { error: delErr } = await admin
        .from('leave_requests')
        .delete()
        .eq('employee_id', req.employee_id)
        .eq('start_date', req.work_date)
        .eq('end_date', req.work_date)
        .eq('status', 'approved')
        .like('reason', 'Auto%')
      if (delErr) console.error('Failed to clean up auto-leave:', delErr.message)
    } else if (!dayStatus.includes('half_day')) {
      const { error: delErr } = await admin
        .from('leave_requests')
        .delete()
        .eq('employee_id', req.employee_id)
        .eq('start_date', req.work_date)
        .eq('end_date', req.work_date)
        .eq('status', 'approved')
        .eq('is_half_day', true)
        .like('reason', 'Auto%')
      if (delErr) console.error('Failed to clean up auto-leave:', delErr.message)
    }

    const { error: regErr } = await admin
      .from('attendance_regularizations')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq('id', id)
    if (regErr) redirect(`/team/regularization?tab=pending&error=${encodeURIComponent('Failed to approve regularization: ' + regErr.message)}`)

    await logAudit({ actorId: user.id, action: 'regularization.approve', tableName: 'attendance_regularizations', recordId: id, oldValue: { status: 'pending' }, newValue: { status: 'approved', employee_id: req.employee_id, field: req.field, requested_value: req.requested_value } })

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

    const { error: regErr } = await admin
      .from('attendance_regularizations')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_note: adminNote,
      })
      .eq('id', id)
    if (regErr) redirect(`/team/regularization?tab=pending&error=${encodeURIComponent('Failed to reject regularization: ' + regErr.message)}`)

    await logAudit({ actorId: user.id, action: 'regularization.reject', tableName: 'attendance_regularizations', recordId: id })

    redirect('/team/regularization?tab=pending')
  }

  function statusBadge(s: string) {
    const map: Record<string, { bg: string; fg: string }> = {
      pending: { bg: 'rgba(245,158,11,0.12)', fg: 'var(--warning)' },
      approved: { bg: 'rgba(34,197,94,0.12)', fg: 'var(--success)' },
      rejected: { bg: 'rgba(239,68,68,0.12)', fg: 'var(--danger)' },
    }
    const c = map[s] ?? map.pending
    return { background: c.bg, color: c.fg, border: `1px solid ${c.fg}` }
  }

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  function formatTime(t: string | null) {
    if (!t) return null
    const parts = t.split(':')
    const h = parseInt(parts[0])
    const m = parts[1]
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${m} ${ampm}`
  }

  const tabs: Array<{ key: string; label: string; count?: number }> = [
    { key: 'pending', label: 'Pending', count: pendingCount ?? 0 },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Team', href: '/team' },
          { label: 'Regularization' },
        ]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Attendance Regularization
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Review and approve employee attendance corrections
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {tabs.map(t => {
          const active = tab === t.key
          return (
            <a
              key={t.key}
              href={`/team/regularization?tab=${t.key}`}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                background: active ? 'var(--primary)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--muted)',
                border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span style={{
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
                  color: active ? '#fff' : '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  borderRadius: '999px',
                  padding: '0.1rem 0.4rem',
                  minWidth: '1.1rem',
                  textAlign: 'center',
                  lineHeight: '1.2',
                }}>
                  {t.count}
                </span>
              )}
            </a>
          )
        })}
      </div>

      {/* Requests */}
      {!requests || requests.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '1rem', padding: '3rem 1.5rem', textAlign: 'center',
          boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem', lineHeight: 1 }}>
            {tab === 'pending' ? '📋' : tab === 'approved' ? '✅' : '📭'}
          </p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No {tab} requests</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.825rem', margin: 0 }}>
            {tab === 'pending' ? 'All caught up!' : `No ${tab} requests to show.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(requests as any[]).map(r => {
            const emp = r.users as { name: string; departments: { name: string } | null } | null
            const badge = statusBadge(r.status)
            const isCheckIn = r.field === 'check_in'
            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  boxShadow: 'var(--shadow)',
                }}
              >
                {/* Top row: Employee + Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>
                      {emp?.name ?? '—'}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0.125rem 0 0' }}>
                      {(emp?.departments as { name: string } | null)?.name ?? '—'}
                    </p>
                  </div>
                  <span style={{
                    ...badge,
                    borderRadius: '999px',
                    padding: '0.2rem 0.625rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {r.status}
                  </span>
                </div>

                {/* Info grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.625rem',
                  marginBottom: '0.75rem',
                }}>
                  <div style={{
                    background: 'var(--surface2)',
                    borderRadius: '0.625rem',
                    padding: '0.625rem 0.75rem',
                  }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>
                      Date
                    </p>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.85rem' }}>
                      {formatDate(r.work_date)}
                    </p>
                  </div>
                  <div style={{
                    background: 'var(--surface2)',
                    borderRadius: '0.625rem',
                    padding: '0.625rem 0.75rem',
                  }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>
                      {isCheckIn ? 'Check-In' : 'Check-Out'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{
                        fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace',
                        color: r.current_value ? 'var(--danger)' : 'var(--muted)',
                      }}>
                        {formatTime(r.current_value) ?? '—'}
                      </span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>→</span>
                      <span style={{
                        fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace',
                        color: 'var(--success)',
                      }}>
                        {formatTime(r.requested_value) ?? r.requested_value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {r.reason && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    fontStyle: 'italic',
                    marginBottom: tab === 'pending' ? '0.75rem' : 0,
                    lineHeight: 1.4,
                  }}>
                    &ldquo;{r.reason}&rdquo;
                  </div>
                )}

                {/* Admin note for reviewed requests */}
                {tab !== 'pending' && r.admin_note && (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text)',
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'var(--surface2)',
                    borderRadius: '0.5rem',
                    borderLeft: '3px solid var(--primary)',
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Admin Note</span>
                    <p style={{ margin: '0.2rem 0 0' }}>{r.admin_note}</p>
                  </div>
                )}

                {/* Actions for pending */}
                {tab === 'pending' && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '0.75rem',
                  }}>
                    <RegularizationActions
                      id={r.id}
                      approveAction={approveRequest}
                      rejectAction={rejectRequest}
                    />
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
