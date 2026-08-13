import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['Day 1', 'Week 1', 'Month 1', 'IT Setup', 'HR Paperwork', 'Training', 'General']

function priorityColor(p: string) {
  if (p === 'high') return { bg: '#fee2e2', color: '#991b1b' }
  if (p === 'low') return { bg: '#f0fdf4', color: '#166534' }
  return { bg: '#fef3c7', color: '#92400e' }
}

function assigneeColor(a: string) {
  if (a === 'employee') return { bg: '#dbeafe', color: '#1e40af' }
  if (a === 'it') return { bg: '#f3e8ff', color: '#7e22ce' }
  if (a === 'manager') return { bg: '#fce7f3', color: '#9d174d' }
  return { bg: '#ede9fe', color: '#6d28d9' }
}

function assigneeLabel(a: string) {
  if (a === 'employee') return 'Employee'
  if (a === 'it') return 'IT'
  if (a === 'manager') return 'Manager'
  return 'HR'
}

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
  const { data: emp } = await admin
    .from('users')
    .select('id, name, role, hire_date, departments(name)')
    .eq('id', employeeId)
    .single()
  if (!emp) redirect('/manage/onboarding')

  const { data: templates } = await admin
    .from('onboarding_templates')
    .select('id, name, role')
    .or(`role.eq.${emp.role},role.eq.all`)

  const templateIds = templates?.map(t => t.id) ?? []
  const { data: allTasks } = templateIds.length > 0
    ? await admin.from('onboarding_task_items').select('*').in('template_id', templateIds).order('sort_order')
    : { data: [] }

  const { data: progress } = await admin.from('onboarding_progress').select('*').eq('employee_id', employeeId)
  const progressMap = new Map((progress ?? []).map(p => [p.task_item_id, p]))

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
  const doneTasks = allTasks?.filter((t: any) => progressMap.get(t.id)?.completed).length ?? 0
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Group all tasks by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = (allTasks ?? []).filter((t: any) => (t.category ?? 'General') === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, any[]>)
  const otherTasks = (allTasks ?? []).filter((t: any) => !CATEGORIES.includes(t.category ?? 'General'))
  if (otherTasks.length > 0) grouped['Other'] = otherTasks

  // HR tasks vs Employee tasks breakdown
  const hrTasks = (allTasks ?? []).filter((t: any) => t.assigned_to !== 'employee').length
  const empTasks = (allTasks ?? []).filter((t: any) => t.assigned_to === 'employee').length

  const breadcrumbs = isHR
    ? [{ label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' }, { label: 'Onboarding', href: '/manage/onboarding' }, { label: emp.name }]
    : [{ label: 'Home', href: '/dashboard' }, { label: 'My Onboarding' }]

  const hireDate = (emp as any).hire_date ? new Date((emp as any).hire_date) : null

  function dueDateLabel(offset: number | null) {
    if (offset == null || !hireDate) return null
    const d = new Date(hireDate)
    d.setDate(d.getDate() + offset)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={breadcrumbs} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          {isSelf && !isHR ? 'My Onboarding Checklist' : `${emp.name} — Onboarding`}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {(emp as any).departments?.name && <>{(emp as any).departments.name} · </>}
          {hireDate && <>Hired {hireDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · </>}
          {doneTasks} of {totalTasks} tasks complete
        </p>
        {totalTasks > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div style={{ flex: 1, background: 'var(--border)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
              <div style={{
                background: pct === 100 ? '#10b981' : 'var(--primary)',
                borderRadius: '999px', height: '8px', width: `${pct}%`,
              }} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pct === 100 ? '#10b981' : 'var(--primary)', minWidth: '36px' }}>
              {pct}%
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      {totalTasks > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Tasks', value: totalTasks },
            { label: 'Completed', value: doneTasks },
            { label: 'HR Tasks', value: hrTasks },
            { label: 'Employee Tasks', value: empTasks },
          ].map(chip => (
            <div key={chip.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', padding: '0.5rem 0.875rem',
              display: 'flex', flexDirection: 'column',
            }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{chip.label}</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{chip.value}</span>
            </div>
          ))}
        </div>
      )}

      {(!templates || templates.length === 0 || !allTasks || allTasks.length === 0) ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No onboarding tasks</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>No template found for this role.{isHR && ' Create one in Onboarding Templates.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(grouped).map(([category, items]) => {
            const doneInCat = items.filter((t: any) => progressMap.get(t.id)?.completed).length
            return (
              <div key={category} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
                {/* Category header */}
                <div style={{
                  padding: '0.625rem 1.25rem', background: 'var(--surface2)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.875rem' }}>{category}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{items.length} task{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: doneInCat === items.length ? '#10b981' : 'var(--muted)' }}>
                    {doneInCat}/{items.length} done
                  </span>
                </div>

                {/* Tasks */}
                {items.map((t: any, idx: number) => {
                  const prog = progressMap.get(t.id)
                  const done = prog?.completed ?? false
                  const canToggle = isHR || (t.assigned_to === 'employee' && isSelf)
                  const pc = priorityColor(t.priority ?? 'medium')
                  const ac = assigneeColor(t.assigned_to ?? 'hr')
                  const dueLabel = dueDateLabel(t.due_day_offset)

                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                      padding: '0.875rem 1.25rem',
                      borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      opacity: done ? 0.65 : 1,
                      background: done ? 'var(--surface2)' : undefined,
                    }}>
                      {/* Checkbox */}
                      <form action={toggleTask} style={{ flexShrink: 0, marginTop: '2px' }}>
                        <input type="hidden" name="task_item_id" value={t.id} />
                        <input type="hidden" name="currently_done" value={done ? '1' : '0'} />
                        <button type={canToggle ? 'submit' : 'button'} style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          border: `2px solid ${done ? '#10b981' : 'var(--border)'}`,
                          background: done ? '#10b981' : 'transparent',
                          cursor: canToggle ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, padding: 0,
                        }}>
                          {done && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                        </button>
                      </form>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem',
                          textDecoration: done ? 'line-through' : 'none',
                        }}>
                          {t.title}
                        </p>
                        {t.description && (
                          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{t.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ background: ac.bg, color: ac.color, borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 600 }}>
                            {assigneeLabel(t.assigned_to ?? 'hr')} task
                          </span>
                          <span style={{ background: pc.bg, color: pc.color, borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize' }}>
                            {t.priority ?? 'medium'}
                          </span>
                          {dueLabel && (
                            <span style={{ background: 'var(--surface2)', color: 'var(--muted)', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 600 }}>
                              Due {dueLabel}
                            </span>
                          )}
                          {done && prog?.completed_at && (
                            <span style={{ color: '#10b981', fontSize: '0.68rem', fontWeight: 600 }}>
                              ✓ {new Date(prog.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
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
