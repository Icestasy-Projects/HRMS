import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: emp } = await supabase.from('users').select('*').eq('id', id).single()
  if (!emp) redirect('/manage/employees')

  const { data: departments } = await supabase.from('departments').select('*').order('name')

  async function updateEmployee(formData: FormData) {
    'use server'
    const { id } = await params
    const supabase = await createClient()

    await supabase
      .from('users')
      .update({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        role: formData.get('role') as string,
        department_id: (formData.get('department_id') as string) || null,
        employee_type: formData.get('employee_type') as string,
      })
      .eq('id', id)

    redirect('/manage/employees')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Edit Employee
      </h1>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
      >
        <form action={updateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'name', label: 'Full Name', type: 'text', value: emp.name, required: true },
            { name: 'email', label: 'Email', type: 'email', value: emp.email, required: true },
            { name: 'phone', label: 'Phone', type: 'tel', value: emp.phone ?? '', required: false },
          ].map(field => (
            <div key={field.name}>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                defaultValue={field.value}
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
              defaultValue={emp.role}
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
              defaultValue={emp.department_id ?? ''}
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
              defaultValue={emp.employee_type}
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

          <button
            type="submit"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
              marginTop: '0.5rem',
            }}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}
