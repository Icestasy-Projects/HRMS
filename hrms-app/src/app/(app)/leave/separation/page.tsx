import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { todayIST } from '@/lib/attendance'

export const dynamic = 'force-dynamic'

export default async function SeparationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('id, name, role').eq('id', user.id).single()
  if (!employee) redirect('/login')

  const admin = createAdminClient()

  // Fetch existing separation request for this employee
  const { data: existing } = await admin
    .from('separation_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  async function submitSeparation(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const type = formData.get('type') as string
    const reason = formData.get('reason') as string
    const sabbaticalFrom = formData.get('sabbatical_from') as string | null
    const sabbaticalTo = formData.get('sabbatical_to') as string | null

    await admin.from('separation_requests').insert({
      employee_id: user.id,
      type,
      reason,
      sabbatical_from: type === 'sabbatical' ? sabbaticalFrom : null,
      sabbatical_to: type === 'sabbatical' ? sabbaticalTo : null,
      status: 'pending',
    })

    redirect('/leave/separation')
  }

  async function withdrawRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const id = formData.get('id') as string
    await admin.from('separation_requests').delete().eq('id', id).eq('employee_id', user.id).eq('status', 'pending')
    redirect('/leave/separation')
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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Leave', href: '/leave' }, { label: 'Separation Request' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Separation Request
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Apply for resignation or sabbatical leave — subject to HR approval
        </p>
      </div>

      {/* Existing request */}
      {existing && (
        <div style={{
          background: statusBg[existing.status] ?? 'var(--surface)',
          border: `1px solid ${statusColor[existing.status] ?? 'var(--border)'}`,
          borderRadius: '0.875rem', padding: '1.25rem',
          marginBottom: '1.5rem', boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', margin: 0, textTransform: 'capitalize' }}>
                {existing.type === 'resignation' ? 'Resignation' : 'Sabbatical Leave'}
              </p>
              {existing.type === 'sabbatical' && existing.sabbatical_from && (
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
                  {existing.sabbatical_from} → {existing.sabbatical_to}
                </p>
              )}
              {existing.reason && (
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                  &ldquo;{existing.reason}&rdquo;
                </p>
              )}
              {existing.status === 'approved' && existing.notice_period_days && (
                <p style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, margin: '0.375rem 0 0' }}>
                  Notice period: {existing.notice_period_days} days
                </p>
              )}
            </div>
            <span style={{
              background: statusColor[existing.status], color: '#fff',
              borderRadius: '999px', padding: '0.25rem 0.875rem',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap',
            }}>
              {existing.status}
            </span>
          </div>
          {existing.status === 'pending' && (
            <form action={withdrawRequest} style={{ marginTop: '1rem' }}>
              <input type="hidden" name="id" value={existing.id} />
              <button type="submit" style={{
                background: 'transparent', border: '1px solid var(--danger)',
                color: 'var(--danger)', borderRadius: '0.5rem', padding: '0.5rem 1rem',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Withdraw Request
              </button>
            </form>
          )}
        </div>
      )}

      {/* New request form — only if no pending/approved */}
      {(!existing || existing.status === 'rejected') && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', padding: '1.5rem', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: '0 0 1.25rem' }}>
            New Request
          </p>
          <form action={submitSeparation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {(['resignation', 'sabbatical'] as const).map(t => (
                  <label key={t} style={{ cursor: 'pointer' }}>
                    <input type="radio" name="type" value={t} required style={{ display: 'none' }}
                      onChange={e => {
                        const sabbatical = document.getElementById('sabbatical-dates')
                        if (sabbatical) sabbatical.style.display = e.target.value === 'sabbatical' ? 'flex' : 'none'
                      }}
                    />
                    <div style={{
                      border: '2px solid var(--border)', borderRadius: '0.75rem', padding: '1rem',
                      textAlign: 'center', transition: 'border-color 0.15s',
                    }}
                      onClick={e => {
                        const radio = (e.currentTarget.previousSibling as HTMLInputElement)
                        radio.checked = true
                        document.querySelectorAll('[data-type-card]').forEach(el => (el as HTMLElement).style.borderColor = 'var(--border)')
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'
                        const sabbatical = document.getElementById('sabbatical-dates')
                        if (sabbatical) sabbatical.style.display = t === 'sabbatical' ? 'flex' : 'none'
                      }}
                      data-type-card
                    >
                      <p style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{t === 'resignation' ? '🚪' : '🏖'}</p>
                      <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.875rem', textTransform: 'capitalize' }}>{t}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Sabbatical dates — hidden by default */}
            <div id="sabbatical-dates" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>From</label>
                  <input type="date" name="sabbatical_from" min={todayIST()}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>To</label>
                  <input type="date" name="sabbatical_to" min={todayIST()}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem' }} />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Reason (optional)
              </label>
              <textarea name="reason" rows={3} placeholder="Add a note for HR..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', resize: 'vertical' }} />
            </div>

            <button type="submit" style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
              fontSize: '0.95rem', cursor: 'pointer',
            }}>
              Submit Request
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
