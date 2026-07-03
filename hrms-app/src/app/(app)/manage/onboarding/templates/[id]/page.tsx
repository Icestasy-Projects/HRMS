import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.75rem',
  padding: '0.625rem 0.875rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' as const,
  fontSize: '0.875rem',
}

function roleLabel(r: string) {
  return r === 'super_admin' ? 'Super Admin' : r === 'sub_super_admin' ? 'Sub Super Admin' : r === 'admin' ? 'Admin' : r === 'all' ? 'All Roles' : 'Employee'
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: template } = await admin.from('onboarding_templates').select('*').eq('id', id).single()
  if (!template) redirect('/manage/onboarding')

  const { data: tasks } = await admin
    .from('onboarding_task_items')
    .select('*')
    .eq('template_id', id)
    .order('sort_order')

  async function addTask(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || null
    const assigned_to = formData.get('assigned_to') as string
    const { data: existing } = await admin.from('onboarding_task_items').select('sort_order').eq('template_id', id).order('sort_order', { ascending: false }).limit(1)
    const sort_order = (existing?.[0]?.sort_order ?? 0) + 1
    await admin.from('onboarding_task_items').insert({ template_id: id, title, description, assigned_to, sort_order })
    redirect(`/manage/onboarding/templates/${id}`)
  }

  async function deleteTask(formData: FormData) {
    'use server'
    const taskId = formData.get('task_id') as string
    const admin = createAdminClient()
    await admin.from('onboarding_task_items').delete().eq('id', taskId)
    redirect(`/manage/onboarding/templates/${id}`)
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' },
          { label: 'Onboarding', href: '/manage/onboarding' }, { label: template.name },
        ]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{template.name}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {roleLabel(template.role)} · {tasks?.length ?? 0} tasks
        </p>
      </div>

      {/* Task list */}
      <div style={{ marginBottom: '1.5rem' }}>
        {(!tasks || tasks.length === 0) ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
            No tasks yet — add tasks below
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            {tasks.map((task: Record<string, string>, idx: number) => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--primary-l)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '12px',
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{task.title}</p>
                  {task.description && <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{task.description}</p>}
                  <span style={{
                    display: 'inline-block', marginTop: '0.3rem',
                    background: task.assigned_to === 'employee' ? '#dbeafe' : '#ede9fe',
                    color: task.assigned_to === 'employee' ? '#1e40af' : '#6d28d9',
                    borderRadius: '999px', padding: '0.1rem 0.5rem',
                    fontSize: '0.68rem', fontWeight: 600,
                  }}>
                    {task.assigned_to === 'employee' ? 'Employee' : 'HR'} task
                  </span>
                </div>
                <form action={deleteTask}>
                  <input type="hidden" name="task_id" value={task.id} />
                  <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem', lineHeight: 1 }}>✕</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add task form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem' }}>
        <p style={{ fontWeight: 700, color: 'var(--text)', margin: '0 0 1rem' }}>Add Task</p>
        <form action={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input name="title" type="text" required placeholder="Task title" style={inputStyle} />
          <input name="description" type="text" placeholder="Description (optional)" style={inputStyle} />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ color: 'var(--muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Assigned to:</label>
            <select name="assigned_to" style={{ ...inputStyle, width: 'auto', flex: 1 }}>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
            <button type="submit" style={{
              background: 'var(--primary)', color: '#fff', border: 'none',
              borderRadius: '0.625rem', padding: '0.625rem 1rem',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
