import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.75rem',
  padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as const,
}

export default async function NewTemplatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  async function createTemplate(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const { data } = await admin.from('onboarding_templates').insert({ name, role }).select().single()
    if (data) redirect(`/manage/onboarding/templates/${data.id}`)
    else redirect('/manage/onboarding')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' },
          { label: 'Onboarding', href: '/manage/onboarding' }, { label: 'New Template' },
        ]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>New Template</h1>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
        <form action={createTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Template Name</label>
            <input name="name" type="text" required placeholder="e.g. Standard Employee Onboarding" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Applies To Role</label>
            <select name="role" style={inputStyle}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
              <option value="sub_super_admin">Sub Super Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="all">All Roles</option>
            </select>
          </div>
          <button type="submit" style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
            fontSize: '1rem', cursor: 'pointer', marginTop: '0.25rem',
          }}>
            Create Template
          </button>
        </form>
      </div>
    </div>
  )
}
