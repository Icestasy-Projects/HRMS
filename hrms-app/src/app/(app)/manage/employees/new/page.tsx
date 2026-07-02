import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import NewEmployeeForm from './NewEmployeeForm'

export default async function NewEmployeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: departments } = await supabase.from('departments').select('*').order('name')
  const { data: managers } = await supabase
    .from('users')
    .select('id, name, role')
    .in('role', ['admin', 'super_admin'])
    .eq('is_active', true)
    .order('name')

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Manage', href: '/manage' },
          { label: 'Employees', href: '/manage/employees' },
          { label: 'Add Employee' },
        ]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Add Employee
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Default password <strong>Test@123</strong> — employee must change it on first login.
        </p>
      </div>

      <NewEmployeeForm
        departments={departments ?? []}
        managers={managers ?? []}
      />
    </div>
  )
}
