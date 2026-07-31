import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import SalaryCalculator from './SalaryCalculator'

export const dynamic = 'force-dynamic'

export default async function SalaryCalculatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' }, { label: 'Salary Calculator' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Salary Structure Calculator
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Enter Annual CTC to compute full salary breakup including employer and employee contributions
        </p>
      </div>
      <SalaryCalculator />
    </div>
  )
}
