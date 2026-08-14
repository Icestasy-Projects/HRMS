import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EmployeeLeaveDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()
  const year = new Date().getFullYear()

  const { data: emp } = await admin
    .from('users')
    .select('id, name, role, employee_type, departments(name)')
    .eq('id', userId)
    .single()

  if (!emp) redirect('/team/leave-overview')

  const { data: balRow } = await admin
    .from('leave_balances')
    .select('sl_total, ul_total, sl_penalty')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle()

  const { data: requests } = await admin
    .from('leave_requests')
    .select('*')
    .eq('employee_id', userId)
    .order('start_date', { ascending: false })

  const slTotal = balRow?.sl_total ?? 18
  const ulTotal = balRow?.ul_total ?? 6
  const slPenalty = Number(balRow?.sl_penalty ?? 0)

  const thisYear = requests?.filter(r => r.start_date?.startsWith(String(year))) ?? []
  const slUsed = thisYear.filter(r => r.leave_type === 'SL' && r.status === 'approved').reduce((s, r) => s + Number(r.days_count), 0)
  const ulUsed = thisYear.filter(r => r.leave_type === 'UL' && r.status === 'approved').reduce((s, r) => s + Number(r.days_count), 0)
  const effectiveSlUsed = Math.round((slUsed + slPenalty) * 10) / 10
  const slRemaining = Math.max(0, Math.round((slTotal - effectiveSlUsed) * 10) / 10)

  function statusColor(s: string) {
    if (s === 'approved') return 'var(--success)'
    if (s === 'pending') return 'var(--warning)'
    if (s === 'rejected') return 'var(--danger)'
    return 'var(--muted)'
  }

  function typeLabel(t: string) {
    if (t === 'SL') return 'Scheduled'
    if (t === 'UL') return 'Unscheduled'
    return t
  }

  const dept = (emp.departments as unknown as { name: string } | null)?.name ?? '—'

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Team', href: '/team' },
          { label: 'Leave Overview', href: '/team/leave-overview' },
          { label: emp.name },
        ]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          {emp.name}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{dept} · {year} leave record</p>
      </div>

      {/* Balance summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>Scheduled Leave</p>
          <p style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--primary)', margin: 0, lineHeight: 1 }}>{slRemaining}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0.25rem 0 0' }}>{effectiveSlUsed} used · {slTotal} total</p>
          {slPenalty > 0 && (
            <p style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600, margin: '0.3rem 0 0' }}>
              Includes −{slPenalty} day{slPenalty !== 1 ? 's' : ''} UL penalty
            </p>
          )}
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>Unscheduled / Sick</p>
          <p style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--warning)', margin: 0, lineHeight: 1 }}>{Math.max(0, ulTotal - ulUsed)}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: '0.25rem 0 0' }}>{ulUsed} used · {ulTotal} total</p>
        </div>
      </div>

      {/* Leave request list */}
      {!requests || requests.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center', color: 'var(--muted)',
        }}>
          No leave requests found.
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
        }}>
          {requests.map((req, i) => {
            const sc = statusColor(req.status)
            return (
              <div key={req.id} style={{
                padding: '1rem 1.25rem',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                    {typeLabel(req.leave_type)}{req.is_half_day ? ' · Half Day' : ''}
                    <span style={{
                      marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 600,
                      background: req.leave_type === 'SL' ? 'var(--primary-l)' : 'var(--warning-l)',
                      color: req.leave_type === 'SL' ? 'var(--primary)' : 'var(--warning)',
                      borderRadius: '999px', padding: '0.05rem 0.45rem',
                    }}>{req.leave_type}</span>
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                    {req.start_date} → {req.end_date} · {req.days_count} day{req.days_count !== 1 ? 's' : ''}
                  </p>
                  {req.reason && (
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.15rem 0 0', fontStyle: 'italic' }}>
                      &ldquo;{req.reason}&rdquo;
                    </p>
                  )}
                </div>
                <span style={{
                  background: `${sc}18`, color: sc, border: `1px solid ${sc}`,
                  borderRadius: '999px', padding: '0.2rem 0.65rem',
                  fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap',
                }}>{req.status}</span>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <Link href="/team/leave-overview" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          ← Back to Leave Overview
        </Link>
      </div>
    </div>
  )
}
