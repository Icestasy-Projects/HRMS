import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!employee || (employee.role !== 'admin' && employee.role !== 'super_admin')) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const filterDept = params?.dept

  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  let teamQuery = supabase
    .from('users')
    .select('*, departments(name)')
    .order('name')

  if (employee.role === 'admin') {
    teamQuery = teamQuery.eq('department_id', employee.department_id)
  } else if (filterDept) {
    teamQuery = teamQuery.eq('department_id', filterDept)
  }

  const { data: team } = await teamQuery

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team' }]} />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            {employee.role === 'admin' ? 'My Team' : 'Team'}
          </h1>
          {team && <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{team.length} member{team.length !== 1 ? 's' : ''}</p>}
        </div>

        {employee.role === 'super_admin' && departments && departments.length > 0 && (
          <form style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select name="dept" defaultValue={filterDept ?? ''} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.5rem', padding: '0.5rem 0.875rem',
              color: 'var(--text)', outline: 'none', fontSize: '14px', minHeight: '44px',
            }}>
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button type="submit" style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '0.5rem', padding: '0.5rem 0.875rem',
              color: 'var(--text)', cursor: 'pointer', fontSize: '14px', minHeight: '44px',
            }}>
              Filter
            </button>
          </form>
        )}
      </div>

      {(!team || team.length === 0) ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>👥</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No team members found</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Try a different filter.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
        }}>
          {team.map((member: { id: string; name: string; email: string; role: string; employee_type: string; departments?: { name: string } }, idx: number) => (
            <div
              key={member.id}
              style={{
                padding: '0.875rem 1.25rem',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '1rem',
                borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--primary-l)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)', fontWeight: 700, fontSize: '13px',
                }}>
                  {member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{member.name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                    {member.email}
                    {member.departments && ` · ${(member.departments as { name: string }).name}`}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                {member.employee_type && (
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {member.employee_type.replace('_', ' ')}
                  </span>
                )}
                <span style={{
                  background: 'rgba(124,47,201,0.12)', color: 'var(--primary)',
                  borderRadius: '999px', padding: '0.2rem 0.625rem',
                  fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                }}>
                  {member.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
