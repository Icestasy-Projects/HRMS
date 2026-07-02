import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export default async function NewEmployeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: departments } = await supabase.from('departments').select('*').order('name')

  async function createEmployee(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const role = formData.get('role') as string
    const departmentId = formData.get('department_id') as string
    const employeeType = formData.get('employee_type') as string

    const admin = createAdminClient()

    // Create auth user with default password
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email,
      password: 'Test@123',
      email_confirm: true,
      user_metadata: { name, role, employee_type: employeeType },
    })

    if (authErr || !created?.user) {
      redirect(`/manage/employees/new?error=${encodeURIComponent(authErr?.message ?? 'Failed to create auth user')}`)
    }

    const uid = created.user.id

    // Insert into public.users
    await admin.from('users').upsert({
      id: uid,
      email,
      name,
      phone: phone || null,
      role,
      department_id: departmentId || null,
      employee_type: employeeType,
      is_active: true,
      must_change_password: true,
    }, { onConflict: 'id' })

    // Create leave balance
    await admin.from('leave_balances').upsert({
      user_id: uid,
      year: new Date().getFullYear(),
      sl_total: 18, sl_used: 0,
      ul_total: 6, ul_used: 0,
    }, { onConflict: 'user_id,year' })

    redirect('/manage/employees')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' }, { label: 'Employees', href: '/manage/employees' }, { label: 'Add Employee' }]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Add Employee
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          A default password <strong>Test@123</strong> will be set. The employee must change it on first login.
        </p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
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
                  width: '100%', background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: '0.75rem',
                  padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Role</label>
            <select name="role" required style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none' }}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Department</label>
            <select name="department_id" style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none' }}>
              <option value="">No Department</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Employee Type</label>
            <select name="employee_type" required style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none' }}>
              <option value="white_collar">White Collar</option>
              <option value="blue_collar">Blue Collar</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
              fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem',
            }}
          >
            Create Employee
          </button>
        </form>
      </div>
    </div>
  )
}
