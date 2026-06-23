import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewEmployeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: departments } = await supabase.from('departments').select('*').order('name')

  async function createEmployee(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string
    const departmentId = formData.get('department_id') as string
    const employeeType = formData.get('employee_type') as string

    await supabase.from('users').insert({
      name,
      email,
      phone,
      role,
      department_id: departmentId || null,
      employee_type: employeeType,
    })

    redirect('/manage/employees')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
        Add Employee
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        After adding, the employee can use "Forgot Password" on the login page to set their password.
      </p>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
      >
        <form action={createEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'tel', required: false },
          ].map(field => (
            <div key={field.name}>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                required={field.required}
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Role
            </label>
            <select
              name="role"
              required
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Department
            </label>
            <select
              name="department_id"
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="">No Department</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Employee Type
            </label>
            <select
              name="employee_type"
              required
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="white_collar">White Collar</option>
              <option value="blue_collar">Blue Collar</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                background: 'var(--primary)',
                color: 'var(--text)',
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Create Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
