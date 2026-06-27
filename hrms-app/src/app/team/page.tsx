import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeamFilter from './TeamFilter'

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
    .eq('id', user.id)
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

  const roleColor = (role: string) => {
    if (role === 'super_admin') return { bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' }
    if (role === 'admin') return { bg: 'var(--primary-l)', color: 'var(--primary)', border: 'var(--border)' }
    return { bg: 'var(--surface2)', color: 'var(--muted)', border: 'var(--border)' }
  }

  const typeColor = (type: string) => type === 'blue_collar'
    ? { color: '#1d4ed8', bg: '#dbeafe' }
    : { color: '#065f46', bg: '#d1fae5' }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team' }]} />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            {employee.role === 'admin' ? 'My Team' : 'Team'}
          </h1>
          {team && (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {team.length} member{team.length !== 1 ? 's' : ''}
              {filterDept && departments?.find(d => d.id === filterDept) && (
                <span> · {departments.find(d => d.id === filterDept)?.name}</span>
              )}
            </p>
          )}
        </div>

        {employee.role === 'super_admin' && departments && departments.length > 0 && (
          <TeamFilter departments={departments} currentDept={filterDept} />
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
          {team.map((member, idx) => {
            const rc = roleColor(member.role)
            const tc = typeColor(member.employee_type)
            const initials = member.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div
                key={member.id}
                style={{
                  padding: '0.875rem 1.25rem',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '1rem',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--primary-l), var(--surface2))',
                    border: '2px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', fontWeight: 700, fontSize: '14px',
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.name}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0.15rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.email}
                      {member.departments && ` · ${(member.departments as { name: string }).name}`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {member.employee_type && (
                    <span style={{
                      background: tc.bg, color: tc.color,
                      borderRadius: '999px', padding: '0.2rem 0.625rem',
                      fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                      whiteSpace: 'nowrap',
                    }}>
                      {member.employee_type.replace('_', ' ')}
                    </span>
                  )}
                  <span style={{
                    background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                    borderRadius: '999px', padding: '0.2rem 0.625rem',
                    fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}>
                    {member.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
