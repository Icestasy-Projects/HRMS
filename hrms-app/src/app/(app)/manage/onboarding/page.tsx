import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: templates } = await admin
    .from('onboarding_templates')
    .select('*, onboarding_task_items(count)')
    .order('name')

  const { data: recentEmployees } = await admin
    .from('users')
    .select('id, name, role, departments(name), created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: progressSummary } = await admin
    .from('onboarding_progress')
    .select('employee_id, completed')

  // Group progress by employee
  const progressMap = new Map<string, { total: number; done: number }>()
  progressSummary?.forEach(p => {
    if (!progressMap.has(p.employee_id)) progressMap.set(p.employee_id, { total: 0, done: 0 })
    const e = progressMap.get(p.employee_id)!
    e.total++
    if (p.completed) e.done++
  })

  function roleLabel(r: string) {
    return r === 'super_admin' ? 'Super Admin' : r === 'sub_super_admin' ? 'Sub Super Admin' : r === 'admin' ? 'Admin' : 'Employee'
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' }, { label: 'Onboarding' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Onboarding</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage templates and track new hire progress</p>
          </div>
          <Link href="/manage/onboarding/templates/new" style={{
            background: 'var(--primary)', color: '#fff', borderRadius: '0.625rem',
            padding: '0.625rem 1.125rem', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
          }}>
            + New Template
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        {/* Templates */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.75rem' }}>
            Templates ({templates?.length ?? 0})
          </p>
          {(!templates || templates.length === 0) ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>No templates yet</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>Create a template to define onboarding tasks</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {templates.map((t: Record<string, unknown>) => {
                const taskCount = (t.onboarding_task_items as { count: number }[] | null)?.[0]?.count ?? 0
                return (
                  <Link key={String(t.id)} href={`/manage/onboarding/templates/${t.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                      <div>
                        <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0 }}>{String(t.name)}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                          {roleLabel(String(t.role))} · {taskCount} tasks
                        </p>
                      </div>
                      <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Edit →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent employees with progress */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.75rem' }}>
            Recent Hires — Onboarding Status
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentEmployees?.map(emp => {
              const prog = progressMap.get(emp.id)
              const pct = prog && prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : null
              return (
                <Link key={emp.id} href={`/manage/onboarding/${emp.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '0.875rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: prog ? '0.5rem' : 0 }}>
                      <div>
                        <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{emp.name}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0.1rem 0 0' }}>
                          {roleLabel(emp.role)}{emp.departments ? ` · ${(emp.departments as { name: string }).name}` : ''}
                        </p>
                      </div>
                      {pct !== null ? (
                        <span style={{
                          background: pct === 100 ? '#d1fae5' : 'var(--primary-l)',
                          color: pct === 100 ? '#065f46' : 'var(--primary)',
                          borderRadius: '999px', padding: '0.2rem 0.625rem',
                          fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                        }}>
                          {pct === 100 ? '✓ Complete' : `${pct}%`}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>Not started</span>
                      )}
                    </div>
                    {prog && prog.total > 0 && (
                      <div style={{ background: 'var(--border)', borderRadius: '999px', height: '4px' }}>
                        <div style={{ background: pct === 100 ? '#10b981' : 'var(--primary)', borderRadius: '999px', height: '4px', width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
