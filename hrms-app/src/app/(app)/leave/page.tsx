import Breadcrumb from '@/components/Breadcrumb'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { carryforwardWarning, unpaidLeaveWarning, balanceLabel } from '@/lib/leave'

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  const admin = createAdminClient()
  const { data: balance, error: balanceError } = await admin
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .maybeSingle()

  let insertError: string | null = null
  let finalBalance = balance
  if (!balance) {
    const { data: created, error: ie } = await admin
      .from('leave_balances')
      .insert({ employee_id: employee.id, scheduled_balance: 18, scheduled_total: 18, unscheduled_balance: 6, unscheduled_total: 6 })
      .select().single()
    if (ie) insertError = ie.message
    finalBalance = created
  }

  const debugInfo = `empId:${employee.id} | selectErr:${balanceError?.message ?? 'none'} | insertErr:${insertError ?? 'none'} | balance:${finalBalance ? 'found' : 'null'}`

  const carryWarn = finalBalance ? carryforwardWarning(finalBalance.scheduled_balance) : null
  const unpaidWarn = finalBalance ? unpaidLeaveWarning(finalBalance.scheduled_balance, finalBalance.unscheduled_balance) : null

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'My Leave' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          My Leave
        </h1>
      </div>

      {carryWarn && (
        <div style={{
          background: 'var(--warning-l)', border: '1px solid var(--warning)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--warning)', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 500,
        }}>
          ⚠️ {carryWarn}
        </div>
      )}

      {unpaidWarn && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 500,
        }}>
          ⚠️ {unpaidWarn}
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>{debugInfo}</div>

      {finalBalance ? (
        <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-l), var(--surface))',
            border: '1px solid var(--border)', borderRadius: '0.75rem',
            padding: '1.5rem', boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>
              {balanceLabel(finalBalance.scheduled_balance, finalBalance.scheduled_total, 'scheduled')}
            </p>
            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '3rem', margin: 0, lineHeight: 1 }}>{finalBalance.scheduled_balance}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.375rem 0 0' }}>of {finalBalance.scheduled_total ?? '—'} days</p>
          </div>

          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.5rem', boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.75rem' }}>
              {balanceLabel(finalBalance.unscheduled_balance, finalBalance.unscheduled_total, 'unscheduled')}
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '3rem', margin: 0, lineHeight: 1 }}>{finalBalance.unscheduled_balance}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.375rem 0 0' }}>of {finalBalance.unscheduled_total ?? '—'} days</p>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2rem', textAlign: 'center',
          color: 'var(--muted)', marginBottom: '1.75rem', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
          <p style={{ fontWeight: 600, margin: '0 0 0.25rem', color: 'var(--text)' }}>No Leave Balance Found</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Contact your HR administrator to set up your leave balance.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/leave/request" style={{
          background: 'var(--primary)', color: '#fff',
          borderRadius: '0.5rem', padding: '0.75rem 1.5rem',
          fontWeight: 600, fontSize: '0.9rem', minHeight: '44px',
          display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow)',
        }}>
          + Request Leave
        </Link>
        <Link href="/leave/history" style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text)', borderRadius: '0.5rem', padding: '0.75rem 1.25rem',
          fontWeight: 600, fontSize: '0.9rem', minHeight: '44px',
          display: 'flex', alignItems: 'center',
        }}>
          View History
        </Link>
      </div>
    </div>
  )
}
