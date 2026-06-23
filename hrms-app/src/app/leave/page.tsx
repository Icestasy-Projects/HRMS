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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        My Leave
      </h1>

      {carryWarn && (
        <div
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid var(--warning)',
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            color: 'var(--warning)',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {carryWarn}
        </div>
      )}

      {unpaidWarn && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--danger)',
            borderRadius: '1rem',
            padding: '1rem 1.25rem',
            color: 'var(--danger)',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          {unpaidWarn}
        </div>
      )}

      {balance ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '1.5rem' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
            }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {balanceLabel(balance.scheduled_balance, balance.scheduled_total, 'scheduled')}
            </p>
            <p style={{ color: 'var(--text)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
              {balance.scheduled_balance}
            </p>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
            }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {balanceLabel(balance.unscheduled_balance, balance.unscheduled_total, 'unscheduled')}
            </p>
            <p style={{ color: 'var(--text)', fontSize: '2rem', fontWeight: 700, margin: 0 }}>
              {balance.unscheduled_balance}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--muted)',
            marginBottom: '1.5rem',
          }}
        >
          No leave balance found. Contact your administrator.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link
          href="/leave/request"
          style={{
            background: 'var(--primary)',
            color: 'var(--text)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            textDecoration: 'none',
            fontWeight: 600,
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Request Leave
        </Link>
        <Link
          href="/leave/history"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            textDecoration: 'none',
            fontWeight: 600,
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          View History
        </Link>
      </div>
    </div>
  )
}
