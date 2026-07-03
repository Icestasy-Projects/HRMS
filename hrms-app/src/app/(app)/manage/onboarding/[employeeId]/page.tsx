import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function EmployeeOnboardingPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  const isHR = me && ['super_admin', 'sub_super_admin'].includes(me.role)
  const isSelf = user.id === employeeId
  if (!isHR && !isSelf) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: emp } = await admin.from('users').select('id, name, role, departments(name)').eq('id', employeeId).single()
  if (!emp) redirect('/manage/onboarding')

  // Find matching template for employee's role
  const { data: templates } = await admin.from('onboarding_templates').select('*, onboarding_task_items(*)')
    .or(`role.eq.${emp.role},role.eq.all`)

  // Get all task items for these templates
  const templateIds = templates?.map(t => t.id) ?? []
  const { data: allTasks } = templateIds.length > 0
    ? await admin.from('onboarding_task_items').select('*').in('template_id', templateIds).order('sort_order')
    : { data: [] }

  // Get existing progress
  const { data: progress } = await admin.from('onboarding_progress').select('*').eq('employee_id', employeeId)
  const progressMap = new Map((progress ?? []).map(p => [p.task_item_id, p]))

  // Group tasks by template
  const templateMap = new Map((templates ?? []).map(t => [t.id, t]))

  async function toggleTask(formData: FormData) {
    'use server'
    const taskItemId = formData.get('task_item_id') as string
    const currentlyDone = formData.get('currently_done') === '1'
    const admin = createAdminClient()
    const { data: { user } } = await createClient().then(c => c.auth.getUser())
    if (currentlyDone) {
      await admin.from('onboarding_progress').delete()
        .eq('employee_id', employeeId).eq('task_item_id', taskItemId)
    } else {
      await admin.from('onboarding_progress').upsert({
        employee_id: employeeId, task_item_id: taskItemId,
        completed: true, completed_at: new Date().toISOString(), completed_by: user?.id,
      }, { onConflict: 'employee_id,task_item_id' })
    }
    redirect(`/manage/onboarding/${employeeId}`)
  }

  const totalTasks = allTasks?.length ?? 0
  const doneTasks = allTasks?.filter(t => progressMap.get(t.id)?.completed).length ?? 0
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const breadcrumbs = isHR
    ? [{ label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' }, { label: 'Onboarding', href: '/manage/onboarding' }, { label: emp.name }]
    : [{ label: 'Home', href: '/dashboard' }, { label: 'My Onboarding' }]

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={breadcrumbs} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          {isSelf && !isHR ? 'My Onboarding Checklist' : `${emp.name} — Onboarding`}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {doneTasks} of {totalTasks} tasks complete
        </p>
        {totalTasks > 0 && (
          <div style={{ background: 'var(--border)', borderRadius: '999px', height: '6px', marginTop: '0.625rem' }}>
            <div style={{
              background: pct === 100 ? '#10b981' : 'var(--primary)',
              borderRadius: '999px', height: '6px', width: `${pct}%`, transition: 'width 0.3s',
            }} />
          </div>
        )}
      </div>

      {(!templates || templates.length === 0 || !allTasks || allTasks.length === 0) ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No onboarding tasks</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>No template found for this role. {isHR && 'Create one in Onboarding Templates.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {templates?.map(template => {
            const templateTasks = allTasks?.filter(t => t.template_id === template.id) ?? []
            if (templateTasks.length === 0) return null
            return (
              <div key={template.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0 }}>{template.name}</p>
                </div>
                {(templateTasks as Array<{ id: string; title: string; description?: string; assigned_to: string; template_id: string; sort_order: number }>).map((t, idx) => {
                  const prog = progressMap.get(t.id)
                  const done = prog?.completed ?? false
                  const canToggle = isHR || (t.assigned_to === 'employee' && isSelf)
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                      padding: '0.875rem 1.25rem',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      opacity: done ? 0.7 : 1,
                    }}>
                      <form action={toggleTask} style={{ flexShrink: 0, marginTop: '2px' }}>
                        <input type="hidden" name="task_item_id" value={t.id} />
                        <input type="hidden" name="currently_done" value={done ? '1' : '0'} />
                        <button type={canToggle ? 'submit' : 'button'} style={{
                          width: '20px', height: '20px', borderRadius: '50%',
                          border: `2px solid ${done ? '#10b981' : 'var(--border)'}`,
                          background: done ? '#10b981' : 'transparent',
                          cursor: canToggle ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, padding: 0,
                        }}>
                          {done && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                        </button>
                      </form>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem', textDecoration: done ? 'line-through' : 'none' }}>
                          {t.title}
                        </p>
                        {t.description && (
                          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{t.description}</p>
                        )}
                        <span style={{
                          display: 'inline-block', marginTop: '0.3rem',
                          background: t.assigned_to === 'employee' ? '#dbeafe' : '#ede9fe',
                          color: t.assigned_to === 'employee' ? '#1e40af' : '#6d28d9',
                          borderRadius: '999px', padding: '0.1rem 0.5rem',
                          fontSize: '0.68rem', fontWeight: 600,
                        }}>
                          {t.assigned_to === 'employee' ? 'Employee' : 'HR'} task
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
