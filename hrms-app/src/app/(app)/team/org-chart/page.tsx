import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import OrgChart from './OrgChart'

export const dynamic = 'force-dynamic'

export default async function OrgChartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const [{ data: users }, { data: separations }] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, role, department_id, manager_id, email, employee_type, is_active, departments(name)')
      .eq('is_active', true)
      .order('name'),
    admin
      .from('separation_requests')
      .select('employee_id, type, sabbatical_from, sabbatical_to')
      .eq('status', 'approved'),
  ])

  const separationMap: Record<string, { type: string; sabbatical_from?: string | null; sabbatical_to?: string | null }> = {}
  for (const s of separations ?? []) {
    separationMap[s.employee_id] = { type: s.type, sabbatical_from: s.sabbatical_from, sabbatical_to: s.sabbatical_to }
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Org Chart' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Org Chart
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Reporting hierarchy across the organisation</p>
      </div>
      <OrgChart
        users={(users ?? []) as unknown as Array<{ id: string; name: string; role: string; department_id: string | null; manager_id: string | null; email: string; employee_type?: string; is_active?: boolean; departments?: { name: string } | null }>}
        separationMap={separationMap}
      />
    </div>
  )
}
