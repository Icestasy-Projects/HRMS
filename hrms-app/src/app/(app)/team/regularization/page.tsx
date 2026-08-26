import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import RegularizationActions from '@/components/RegularizationActions'
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

    if (dayStatus === 'present' || (!dayStatus.includes('half_day') && newCheckIn && newCheckOut)) {
      await admin
        .from('leave_requests')
        .delete()
        .eq('employee_id', req.employee_id)
        .eq('start_date', req.work_date)
        .eq('end_date', req.work_date)
        .eq('status', 'approved')
        .like('reason', 'Auto%')
    } else if (!dayStatus.includes('half_day')) {
      await admin
        .from('leave_requests')
        .delete()
        .eq('employee_id', req.employee_id)
        .eq('start_date', req.work_date)
        .eq('end_date', req.work_date)
        .eq('status', 'approved')
        .eq('is_half_day', true)
        .like('reason', 'Auto%')
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

  const thStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid var(--border)',
  }

  const tdStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    fontSize: '0.85rem',
    color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', boxShadow: 'var(--shadow)',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Field</th>
                <th style={thStyle}>Current</th>
                <th style={thStyle}>Requested</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
                {tab === 'pending' && <th style={thStyle}>Actions</th>}
                {tab !== 'pending' && <th style={thStyle}>Admin Note</th>}
              </tr>
            </thead>
            <tbody>
              {(requests as any[]).map(r => {
                const emp = r.users as { name: string; departments: { name: string } | null } | null
                const sc = statusColor(r.status)
                return (
                  <tr key={r.id}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 700, display: 'block' }}>{emp?.name ?? '—'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {(emp?.departments as { name: string } | null)?.name ?? '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: 'nowrap' }}>{r.work_date}</td>
                    <td style={tdStyle}>
                      {r.field === 'check_in' ? 'Check-In' : 'Check-Out'}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--danger)', fontWeight: 600 }}>
                      {r.current_value ?? '—'}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--success)', fontWeight: 600 }}>
                      {r.requested_value}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: '160px', fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                      {r.reason || '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        background: `${sc}18`, color: sc,
                        border: `1px solid ${sc}`,
                        borderRadius: '999px', padding: '0.15rem 0.5rem',
                        fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'capitalize', whiteSpace: 'nowrap',
                      }}>{r.status}</span>
                    </td>
                    {tab === 'pending' && (
                      <td style={{ ...tdStyle, minWidth: '220px' }}>
                        <RegularizationActions
                          id={r.id}
                          approveAction={approveRequest}
                          rejectAction={rejectRequest}
                        />
                      </td>
                    )}
                    {tab !== 'pending' && (
                      <td style={{ ...tdStyle, fontSize: '0.8rem' }}>
                        {r.admin_note || '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
