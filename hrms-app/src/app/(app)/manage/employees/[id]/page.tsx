import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { logAudit } from '@/lib/audit'
import SuccessToast from '@/components/SuccessToast'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.75rem',
  padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none',
} as React.CSSProperties

export default async function EditEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const { data: emp } = await supabase.from('users').select('*').eq('id', id).single()
  if (!emp) redirect('/manage/employees')

  const { data: departments } = await supabase.from('departments').select('*').order('name')
  const { data: managers } = await supabase
    .from('users')
    .select('id, name, role')
    .in('role', ['admin', 'sub_super_admin', 'super_admin'])
    .eq('is_active', true)
    .neq('id', id) // can't be own manager
    .order('name')

  async function updateEmployee(formData: FormData) {
    'use server'
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return
    const role = formData.get('role') as string

    // manager logic mirrors add form
    let managerId: string | null = (formData.get('manager_id') as string) || null
    if (role === 'super_admin') managerId = null
    if (role === 'sub_super_admin') {
      // keep whatever was submitted (auto-assigned on add, editable here)
    }

    const { error } = await supabase.from('users').update({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || null,
      role,
      department_id: (formData.get('department_id') as string) || null,
      employee_type: formData.get('employee_type') as string,
      manager_id: managerId,
      location: (formData.get('location') as string) || null,
    }).eq('id', id)
    if (error) redirect(`/manage/employees/${id}?error=${encodeURIComponent('Failed to update employee: ' + error.message)}`)

    await logAudit({ actorId: user.id, action: 'employee.update', tableName: 'users', recordId: id, newValue: { name: formData.get('name'), role, employee_type: formData.get('employee_type'), department_id: formData.get('department_id') || null, manager_id: managerId, location: formData.get('location') || null } })

    redirect('/manage/employees')
  }

  async function resetPassword(formData: FormData) {
    'use server'
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return

    const newPassword = formData.get('new_password') as string
    if (!newPassword || newPassword.length < 8) {
      redirect(`/manage/employees/${id}?error=${encodeURIComponent('Password must be at least 8 characters')}`)
    }

    const admin = createAdminClient()
    const { error } = await admin.auth.admin.updateUserById(id, { password: newPassword })
    if (error) {
      redirect(`/manage/employees/${id}?error=${encodeURIComponent('Failed to reset password: ' + error.message)}`)
    }

    await logAudit({ actorId: user.id, action: 'employee.password_reset', tableName: 'users', recordId: id, newValue: { password_reset: true } })

    redirect(`/manage/employees/${id}?success=${encodeURIComponent('Password has been reset successfully')}`)
  }

  const roleLabel = (r: string) =>
    r === 'super_admin' ? 'Super Admin' : r === 'sub_super_admin' ? 'Sub Super Admin' : r === 'admin' ? 'Admin' : r

  const isSuperAdmin = emp.role === 'super_admin'

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Manage', href: '/manage' },
          { label: 'Employees', href: '/manage/employees' },
          { label: 'Edit Employee' },
        ]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Edit Employee
        </h1>
      </div>

      {sp.success && <SuccessToast message={sp.success} />}
      {sp.error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.875rem',
        }}>
          {sp.error}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
        <form action={updateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'name', label: 'Full Name', type: 'text', value: emp.name, required: true },
            { name: 'email', label: 'Email', type: 'email', value: emp.email, required: true },
            { name: 'phone', label: 'Phone', type: 'tel', value: emp.phone ?? '', required: false },
            { name: 'location', label: 'Location', type: 'text', value: emp.location ?? '', required: false },
          ].map(field => (
            <div key={field.name}>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>{field.label}</label>
              <input name={field.name} type={field.type} defaultValue={field.value} required={field.required} style={inputStyle} />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Role</label>
            <select name="role" defaultValue={emp.role} style={inputStyle}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="sub_super_admin">Sub Super Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {isSuperAdmin ? (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
                Manager: <strong style={{ color: 'var(--text)' }}>None</strong> — top of hierarchy
              </p>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Manager</label>
              <select name="manager_id" defaultValue={emp.manager_id ?? ''} style={inputStyle}>
                <option value="">No Manager</option>
                {managers?.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({roleLabel(m.role)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Department</label>
            <select name="department_id" defaultValue={emp.department_id ?? ''} style={inputStyle}>
              <option value="">No Department</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Employee Type</label>
            <select name="employee_type" defaultValue={emp.employee_type} style={inputStyle}>
              <option value="white_collar">White Collar</option>
              <option value="blue_collar">Blue Collar</option>
            </select>
          </div>

          <ConfirmSubmitButton
            label="Save Changes"
            confirmTitle="Save Employee Changes"
            confirmMessage="Are you sure you want to save these changes?"
            confirmLabel="Yes, Save"
            style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
              fontSize: '1rem', marginTop: '0.5rem', width: '100%',
            }}
          />
        </form>
      </div>

      {/* Reset Password */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.25rem' }}>
          Reset Password
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 1rem' }}>
          Set a new password for {emp.name}. They will need to use this password on their next login.
        </p>
        <form action={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              New Password
            </label>
            <input
              name="new_password"
              type="text"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              style={inputStyle}
            />
          </div>
          <ConfirmSubmitButton
            label="Reset Password"
            confirmTitle="Reset Employee Password"
            confirmMessage={`Are you sure you want to reset the password for ${emp.name}?`}
            confirmLabel="Yes, Reset"
            variant="warning"
            style={{
              background: 'var(--warning, #f59e0b)', color: '#fff', border: 'none',
              borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
              fontSize: '1rem', width: '100%',
            }}
          />
        </form>
      </div>
    </div>
  )
}
