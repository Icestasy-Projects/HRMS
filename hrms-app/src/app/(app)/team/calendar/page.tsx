import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import TeamCalendar from './TeamCalendar'

export default async function TeamCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('role, department_id').eq('id', user.id).single()
  if (!employee || !['admin', 'super_admin', 'sub_super_admin'].includes(employee.role)) {
    redirect('/dashboard')
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Calendar' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Team Availability
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Monthly leave calendar — all departments
        </p>
      </div>
      <TeamCalendar
        role={employee.role}
        departmentId={employee.department_id ?? null}
      />
    </div>
  )
}
