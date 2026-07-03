import { createClient } from '@/lib/supabase/server'
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

  const { data: users } = await supabase
    .from('users')
    .select('id, name, role, department_id, manager_id, email, departments(name)')
    .eq('is_active', true)
    .order('name')

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Org Chart' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Org Chart
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Reporting hierarchy across the organisation</p>
      </div>
      <OrgChart users={(users ?? []) as unknown as Array<{ id: string; name: string; role: string; department_id: string | null; manager_id: string | null; email: string; departments?: { name: string } | null }>} />
    </div>
  )
}
