import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
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

  // Fetch past requests
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
    await admin
      .from('attendance_regularizations')
      .delete()
      .eq('id', id)
      .eq('employee_id', user.id)
      .eq('status', 'pending')
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

    await admin.from('attendance_regularizations').insert(rows)

    redirect('/attendance/regularization?success=1')
  }

  const today = todayIST()

  function statusColor(s: string) {
    if (s === 'approved') return 'var(--success)'
    if (s === 'rejected') return 'var(--danger)'
    return 'var(--warning)'
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Attendance', href: '/attendance' },
          { label: 'Regularization' },
        ]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Attendance Regularization
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Submit a request to correct your check-in or check-out time
        </p>
      </div>

      {params.success && (
        <>
          <SuccessToast message="✓ Request submitted successfully!" />
          {/* Inline banner below heading */}
          <div style={{
            background: 'var(--success-l)', border: '1px solid var(--success)',
            borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
            color: 'var(--success)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.875rem',
          }}>
            ✓ Request submitted — your admin will review it shortly.
          </div>
        </>
      )}

      {/* Submit form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1.75rem',
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
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.875rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
            overflowX: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Field', 'From → To', 'Reason', 'Status', ''].map(h => (
                    <th key={h} style={{
                      padding: '0.65rem 1rem', textAlign: 'left',
                      fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const sc = statusColor(r.status)
                  return (
                    <tr key={r.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        {r.work_date}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {r.field === 'check_in' ? 'Check-In' : 'Check-Out'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--danger)' }}>{r.current_value ?? '—'}</span>
                        {' → '}
                        <span style={{ color: 'var(--success)' }}>{r.requested_value}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.82rem', maxWidth: '180px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.reason ?? '—'}
                        </span>
                        {r.admin_note && (
                          <span style={{ display: 'block', color: 'var(--text)', fontWeight: 600, marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Admin: {r.admin_note}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: `${sc}18`, color: sc,
                          border: `1px solid ${sc}`,
                          borderRadius: '999px', padding: '0.2rem 0.65rem',
                          fontSize: '0.72rem', fontWeight: 700,
                          textTransform: 'capitalize',
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        {r.status === 'pending' && (
                          <form action={retractRequest}>
                            <input type="hidden" name="id" value={r.id} />
                            <button type="submit" style={{
                              background: 'transparent', border: '1px solid var(--danger)',
                              color: 'var(--danger)', borderRadius: '0.5rem',
                              padding: '0.2rem 0.625rem', fontSize: '0.72rem',
                              fontWeight: 600, cursor: 'pointer',
                            }}>
                              Retract
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
