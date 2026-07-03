import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManageEmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin','sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const { data: employees } = await supabase
    .from('users')
    .select('*, departments(name)')
    .order('name')

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>Home / Manage / Employees</p>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Employees
          </h1>
          {employees && <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>}
        </div>
        <Link href="/manage/employees/new" style={{
          background: 'var(--primary)', color: '#fff',
          borderRadius: '0.5rem', padding: '0.625rem 1.125rem',
          fontWeight: 600, fontSize: '0.9rem', minHeight: '44px',
          display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow)',
        }}>
          + Add Employee
        </Link>
      </div>

      {(!employees || employees.length === 0) ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>👥</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No employees found</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Add your first employee to get started.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
        }}>
          {employees.map((emp: { id: string; name: string; email: string; role: string; employee_type: string; departments?: { name: string } }, idx: number) => (
            <Link key={emp.id} href={`/manage/employees/${emp.id}/view`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '0.875rem 1.25rem',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '0.75rem',
                borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--primary-l)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--primary)', fontWeight: 700, fontSize: '12px',
                  }}>
                    {emp.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{emp.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0.2rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {emp.email} · {emp.departments ? (emp.departments as { name: string }).name : 'No dept'} · {emp.employee_type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                  <span style={{
                    background: 'rgba(124,47,201,0.12)', color: 'var(--primary)',
                    borderRadius: '999px', padding: '0.2rem 0.625rem',
                    fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize',
                  }}>
                    {emp.role?.replace('_', ' ')}
                  </span>
                  <Link href={`/manage/employees/${emp.id}`} onClick={e => e.stopPropagation()} style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: '0.5rem', padding: '0.375rem 0.75rem',
                    color: 'var(--text)', fontSize: '0.8rem', minHeight: '36px',
                    display: 'flex', alignItems: 'center',
                  }}>
                    Edit
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
