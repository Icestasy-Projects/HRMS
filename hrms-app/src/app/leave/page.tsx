import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { balanceLabel, carryforwardWarning, unpaidLeaveWarning } from '@/lib/leave'

export default async function LeavePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
  if (!employee) redirect('/login')

  const year = new Date().getFullYear()
  const { data: balance } = await supabase.from('leave_balances').select('*').eq('employee_id', employee.id).eq('year', year).single()

  const carryWarn = balance ? carryforwardWarning(balance.scheduled_balance) : null
  const unpaidWarn = balance ? unpaidLeaveWarning(balance.scheduled_balance, balance.unscheduled_balance) : null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>My Leave</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Your leave balances and history for {year}.</p>
      </div>

      {carryWarn && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>{carryWarn}</p>
        </div>
      )}
      {unpaidWarn && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <p className="text-sm font-medium" style={{ color: '#fca5a5' }}>{unpaidWarn}</p>
        </div>
      )}

      {balance ? (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Leave Balances — {year}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-h)' }}>{balance.scheduled_balance}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{balanceLabel(balance.scheduled_balance, balance.scheduled_total, 'scheduled')}</div>
              <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Used: {(balance.scheduled_total ?? 0) - balance.scheduled_balance} of {balance.scheduled_total}</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--surface2)' }}>
              <div className="text-3xl font-bold" style={{ color: 'var(--primary-h)' }}>{balance.unscheduled_balance}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{balanceLabel(balance.unscheduled_balance, balance.unscheduled_total, 'unscheduled')}</div>
              <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Used: {(balance.unscheduled_total ?? 0) - balance.unscheduled_balance} of {balance.unscheduled_total}</div>
            </div>
          </div>
          {balance.carryforward_days > 0 && (
            <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
              Carried forward from last year: <strong style={{ color: 'var(--text)' }}>{balance.carryforward_days} days</strong>
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No leave balance record found for {year}. Contact HR.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/leave/request" className="flex-1 rounded-xl py-3 font-semibold text-sm text-center text-white"
          style={{ background: 'var(--primary)', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          + Request Leave
        </Link>
        <Link href="/leave/history" className="flex-1 rounded-xl py-3 font-semibold text-sm text-center"
          style={{ background: 'var(--surface2)', color: 'var(--text)', minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          View History
        </Link>
      </div>
    </div>
  )
}
