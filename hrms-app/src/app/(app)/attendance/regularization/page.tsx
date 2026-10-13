import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'
import SuccessToast from '@/components/SuccessToast'
import RegularizationForm from '@/components/RegularizationForm'
import { todayIST } from '@/lib/attendance'

export const dynamic = 'force-dynamic'

export default async function RegularizationPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: employee } = await admin.from('users').select('id, name').eq('id', user.id).single()
  if (!employee) redirect('/login')

  const { data: requests } = await admin
    .from('attendance_regularizations')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(20)

  async function retractRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const admin = createAdminClient()
    const id = formData.get('id') as string
    const { error: delErr } = await admin
      .from('attendance_regularizations')
      .delete()
      .eq('id', id)
      .eq('employee_id', user.id)
      .eq('status', 'pending')
    if (delErr) redirect(`/attendance/regularization?error=${encodeURIComponent('Failed to retract request: ' + delErr.message)}`)
    redirect('/attendance/regularization')
  }

  async function submitRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const admin = createAdminClient()

    const workDate = formData.get('work_date') as string
    const field = formData.get('field') as string
    const reason = formData.get('reason') as string

    const { data: log } = await admin
      .from('attendance_logs')
      .select('check_in, check_out')
      .eq('user_id', user.id)
      .eq('work_date', workDate)
      .maybeSingle()

    const { data: existingPending } = await admin
      .from('attendance_regularizations')
      .select('id, field')
      .eq('employee_id', user.id)
      .eq('work_date', workDate)
      .eq('status', 'pending')
    const pendingFields = new Set(existingPending?.map(r => r.field) ?? [])

    const rows: Array<{
      employee_id: string; work_date: string; field: string;
      current_value: string | null; requested_value: string;
      reason: string; status: string;
    }> = []

    if ((field === 'check_in' || field === 'both') && !pendingFields.has('check_in')) {
      rows.push({
        employee_id: user.id, work_date: workDate, field: 'check_in',
        current_value: log?.check_in ?? null,
        requested_value: formData.get('requested_value_checkin') as string,
        reason, status: 'pending',
      })
    }
    if ((field === 'check_out' || field === 'both') && !pendingFields.has('check_out')) {
      rows.push({
        employee_id: user.id, work_date: workDate, field: 'check_out',
        current_value: log?.check_out ?? null,
        requested_value: formData.get('requested_value_checkout') as string,
        reason, status: 'pending',
      })
    }

    const { error: insertErr } = await admin.from('attendance_regularizations').insert(rows)
    if (insertErr) redirect(`/attendance/regularization?error=${encodeURIComponent('Failed to submit request: ' + insertErr.message)}`)

    redirect('/attendance/regularization?success=1')
  }

  const today = todayIST()

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

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Attendance', href: '/attendance' },
          { label: 'Regularization' },
        ]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Attendance Regularization
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Submit a request to correct your check-in or check-out time
        </p>
      </div>

      {params.success && (
        <>
          <SuccessToast message="Request submitted successfully!" />
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success)',
            borderRadius: '0.75rem', padding: '0.75rem 1rem',
            color: 'var(--success)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>✓</span>
            Request submitted — your admin will review it shortly.
          </div>
        </>
      )}

      {/* Submit form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.25rem', marginBottom: '2rem',
        boxShadow: 'var(--shadow)',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 1.25rem' }}>
          New Request
        </h2>
        <RegularizationForm today={today} submitAction={submitRequest} />
      </div>

      {/* Past requests */}
      {requests && requests.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.75rem' }}>
            Past Requests
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {requests.map(r => {
              const badge = statusBadge(r.status)
              const isCheckIn = r.field === 'check_in'
              return (
                <div
                  key={r.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '1rem',
                    padding: '0.875rem 1.125rem',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>
                        {formatDate(r.work_date)}
                      </span>
                      <span style={{
                        background: 'var(--surface2)',
                        borderRadius: '0.375rem',
                        padding: '0.125rem 0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--muted)',
                      }}>
                        {isCheckIn ? 'Check-In' : 'Check-Out'}
                      </span>
                    </div>
                    <span style={{
                      ...badge,
                      borderRadius: '999px',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {r.status}
                    </span>
                  </div>

                  {/* Time change */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '0.375rem',
                  }}>
                    <span style={{ color: r.current_value ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
                      {formatTime(r.current_value) ?? '—'}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>→</span>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                      {formatTime(r.requested_value) ?? r.requested_value}
                    </span>
                  </div>

                  {/* Reason */}
                  {r.reason && (
                    <p style={{
                      color: 'var(--muted)', fontSize: '0.775rem',
                      margin: 0, fontStyle: 'italic', lineHeight: 1.4,
                    }}>
                      &ldquo;{r.reason}&rdquo;
                    </p>
                  )}

                  {/* Admin note */}
                  {r.admin_note && (
                    <div style={{
                      fontSize: '0.775rem',
                      color: 'var(--text)',
                      marginTop: '0.5rem',
                      padding: '0.375rem 0.625rem',
                      background: 'var(--surface2)',
                      borderRadius: '0.375rem',
                      borderLeft: '3px solid var(--primary)',
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)' }}>Admin Note</span>
                      <p style={{ margin: '0.15rem 0 0' }}>{r.admin_note}</p>
                    </div>
                  )}

                  {/* Retract button */}
                  {r.status === 'pending' && (
                    <div style={{ marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                      <form action={retractRequest}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmSubmitButton
                          label="Retract Request"
                          confirmTitle="Retract Request"
                          confirmMessage="Are you sure you want to retract this regularization request?"
                          confirmLabel="Yes, Retract"
                          variant="danger"
                          style={{
                            background: 'transparent', border: '1px solid var(--danger)',
                            color: 'var(--danger)', borderRadius: '0.5rem',
                            padding: '0.375rem 0.75rem', fontSize: '0.75rem',
                            fontWeight: 600, cursor: 'pointer',
                          }}
                        />
                      </form>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
