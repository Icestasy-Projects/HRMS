import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManageEmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: employees } = await supabase
    .from('users')
    .select('*, departments(name)')
    .order('name')

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Employees
        </h1>
        <Link
          href="/manage/employees/new"
          style={{
            background: 'var(--primary)',
            color: 'var(--text)',
            borderRadius: '0.75rem',
            padding: '0.625rem 1.125rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          + Add Employee
        </Link>
      </div>

      {(!employees || employees.length === 0) ? (
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
          No employees found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {employees.map((emp: { id: string; name: string; email: string; role: string; employee_type: string; departments?: { name: string } }) => (
            <div
              key={emp.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '0.875rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{emp.name}</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                  {emp.email} · {emp.departments ? (emp.departments as { name: string }).name : 'No dept'} · {emp.employee_type?.replace('_', ' ')}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span
                  style={{
                    background: 'rgba(139,47,201,0.15)',
                    color: 'var(--primary-h)',
                    borderRadius: '0.4rem',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {emp.role?.replace('_', ' ')}
                </span>
                <Link
                  href={`/manage/employees/${emp.id}`}
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: '0.8rem',
                  }}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
