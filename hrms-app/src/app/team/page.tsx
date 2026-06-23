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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {employee.role === 'admin' ? 'My Team' : 'Team'}
        </h1>

        {employee.role === 'super_admin' && departments && departments.length > 0 && (
          <form style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              name="dept"
              defaultValue={filterDept ?? ''}
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.5rem 0.875rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.5rem 0.875rem',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Filter
            </button>
          </form>
        )}
      </div>

      {(!team || team.length === 0) ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          No team members found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {team.map((member: { id: string; name: string; email: string; role: string; employee_type: string; departments?: { name: string } }) => (
            <div
              key={member.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{member.name}</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>{member.email}</p>
                {member.departments && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                    {(member.departments as { name: string }).name}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span
                  style={{
                    background: 'rgba(139,47,201,0.2)',
                    color: 'var(--primary-h)',
                    borderRadius: '0.5rem',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {member.role?.replace('_', ' ')}
                </span>
                {member.employee_type && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0.25rem 0 0', textTransform: 'capitalize' }}>
                    {member.employee_type.replace('_', ' ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
