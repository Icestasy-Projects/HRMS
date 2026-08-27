import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['Day 1', 'Week 1', 'Month 1', 'IT Setup', 'HR Paperwork', 'Training', 'General']
const PRIORITIES = ['high', 'medium', 'low']

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.625rem',
  padding: '0.625rem 0.875rem', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box' as const, fontSize: '0.875rem',
}

function roleLabel(r: string) {
  return r === 'super_admin' ? 'Super Admin' : r === 'sub_super_admin' ? 'Sub Super Admin'
    : r === 'admin' ? 'Admin' : r === 'all' ? 'All Roles' : 'Employee'
}

function priorityColor(p: string) {
  if (p === 'high') return { bg: '#fee2e2', color: '#991b1b' }
  if (p === 'low') return { bg: '#f0fdf4', color: '#166534' }
  return { bg: '#fef3c7', color: '#92400e' }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return
    const admin = createAdminClient()
    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || null
    const assigned_to = formData.get('assigned_to') as string
    const category = (formData.get('category') as string) || 'General'
    const priority = (formData.get('priority') as string) || 'medium'
    const due_day_offset_raw = formData.get('due_day_offset') as string
    const due_day_offset = due_day_offset_raw ? Number(due_day_offset_raw) : null
    const { data: existing } = await admin.from('onboarding_task_items').select('sort_order').eq('template_id', id).order('sort_order', { ascending: false }).limit(1)
    const sort_order = (existing?.[0]?.sort_order ?? 0) + 1
    await admin.from('onboarding_task_items').insert({ template_id: id, title, description, assigned_to, category, priority, due_day_offset, sort_order })
    redirect(`/manage/onboarding/templates/${id}`)
  }

  async function deleteTask(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return
    const taskId = formData.get('task_id') as string
    const admin = createAdminClient()
    await admin.from('onboarding_task_items').delete().eq('id', taskId)
    redirect(`/manage/onboarding/templates/${id}`)
  }

  // Group tasks by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = (tasks ?? []).filter((t: any) => (t.category ?? 'General') === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, any[]>)
  // Tasks with unrecognised category
  const otherTasks = (tasks ?? []).filter((t: any) => !CATEGORIES.includes(t.category ?? 'General'))
  if (otherTasks.length > 0) grouped['Other'] = otherTasks

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
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

      {/* Task list grouped by category */}
      <div style={{ marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {(!tasks || tasks.length === 0) ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>No tasks yet</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Add tasks below to build this template</p>
          </div>
        ) : Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.625rem 1.25rem', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>{category}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{items.length} task{items.length !== 1 ? 's' : ''}</span>
            </div>
            {items.map((task: any, idx: number) => {
              const pc = priorityColor(task.priority ?? 'medium')
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                  padding: '0.875rem 1.25rem',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--primary-l)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '11px',
                  }}>
                    {task.sort_order}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{task.title}</p>
                    {task.description && <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{task.description}</p>}
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: task.assigned_to === 'employee' ? '#dbeafe' : '#ede9fe',
                        color: task.assigned_to === 'employee' ? '#1e40af' : '#6d28d9',
                        borderRadius: '999px', padding: '0.1rem 0.5rem',
                        fontSize: '0.68rem', fontWeight: 600,
                      }}>
                        {task.assigned_to === 'employee' ? 'Employee' : 'HR'} task
                      </span>
                      <span style={{ background: pc.bg, color: pc.color, borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}>
                        {task.priority ?? 'medium'}
                      </span>
                      {task.due_day_offset != null && (
                        <span style={{ background: 'var(--surface2)', color: 'var(--muted)', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 600 }}>
                          Due: Day {task.due_day_offset}
                        </span>
                      )}
                    </div>
                  </div>
                  <form action={deleteTask}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem' }}>✕</button>
                  </form>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Add task form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem 1.5rem' }}>
        <p style={{ fontWeight: 700, color: 'var(--text)', margin: '0 0 1rem', fontSize: '0.95rem' }}>Add Task</p>
        <form action={addTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input name="title" type="text" required placeholder="Task title *" style={inputStyle} />
          <input name="description" type="text" placeholder="Description (optional)" style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Phase / Category</label>
              <select name="category" style={inputStyle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Assigned To</label>
              <select name="assigned_to" style={inputStyle}>
                <option value="hr">HR</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="it">IT</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Priority</label>
              <select name="priority" style={inputStyle}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Due (day from hire date)</label>
              <input name="due_day_offset" type="number" min="0" placeholder="e.g. 1, 7, 30" style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.625rem', padding: '0.75rem',
            fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
          }}>
            + Add Task
          </button>
        </form>
      </div>
    </div>
  )
}
