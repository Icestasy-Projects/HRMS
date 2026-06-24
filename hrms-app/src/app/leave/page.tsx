import { createClient } from '@/lib/supabase/server'
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
    .eq('email', user.email)
    .single()

  if (!employee) redirect('/login')

  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .single()

  const carryWarn = balance ? carryforwardWarning(balance.scheduled_balance) : null
  const unpaidWarn = balance ? unpaidLeaveWarning(balance.scheduled_balance, balance.unscheduled_balance) : null

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1.75rem', letterSpacing: '-0.02em' }}>
        My Leave
      </h1>

      {carryWarn && (
        <div style={{
          background: 'var(--warning-l)',
          border: '1px solid var(--warning)',
          borderRadius: '1rem',
          padding: '0.875rem 1.125rem',
          color: 'var(--warning)',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          ⚠️ {carryWarn}
        </div>
      )}

      {unpaidWarn && (
        <div style={{
          background: 'var(--danger-l)',
          border: '1px solid var(--danger)',
          borderRadius: '1rem',
          padding: '0.875rem 1.125rem',
          color: 'var(--danger)',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}>
          ⚠️ {unpaidWarn}
        </div>
      )}

      {balance ? (
        <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-l), var(--surface))',
            border: '1px solid var(--border)',
            borderRadius: '1.125rem',
            padding: '1.5rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              {balanceLabel(balance.scheduled_balance, balance.scheduled_total, 'scheduled')}
            </p>
            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '3rem', margin: 0, lineHeight: 1 }}>
              {balance.scheduled_balance}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
              of {balance.scheduled_total ?? '—'} days
            </p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1.125rem',
            padding: '1.5rem',
            boxShadow: 'var(--shadow)',
          }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
              {balanceLabel(balance.unscheduled_balance, balance.unscheduled_total, 'unscheduled')}
            </p>
            <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '3rem', margin: 0, lineHeight: 1 }}>
              {balance.unscheduled_balance}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
              of {balance.unscheduled_total ?? '—'} days
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1.125rem',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--muted)',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text)' }}>No Leave Balance Found</p>
          <p style={{ fontSize: '0.875rem' }}>Contact your HR administrator to set up your leave balance.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/leave/request" style={{
          background: 'var(--primary)',
          color: '#fff',
          borderRadius: '0.75rem',
          padding: '0.75rem 1.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          boxShadow: 'var(--shadow)',
        }}>
          + Request Leave
        </Link>
        <Link href="/leave/history" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: '0.75rem',
          padding: '0.75rem 1.25rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
        }}>
          View History
        </Link>
      </div>
    </div>
  )
}
