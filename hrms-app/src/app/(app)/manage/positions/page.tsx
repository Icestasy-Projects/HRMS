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

export default async function PositionsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit: editId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: positions } = await admin.from('positions').select('*, departments(name)').order('title')
  const { data: departments } = await admin.from('departments').select('id, name').order('name')

  // Count filled headcount (active users per... we'll approximate by department for now)
  const { data: userCounts } = await admin.from('users').select('department_id').eq('is_active', true)
  const deptHeadcount = new Map<string, number>()
  userCounts?.forEach(u => {
    if (u.department_id) deptHeadcount.set(u.department_id, (deptHeadcount.get(u.department_id) ?? 0) + 1)
  })

  async function createPosition(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const title = formData.get('title') as string
    const department_id = (formData.get('department_id') as string) || null
    const headcount = parseInt(formData.get('headcount') as string) || 1
    const description = (formData.get('description') as string) || null
    await admin.from('positions').insert({ title, department_id, headcount, description })
    redirect('/manage/positions')
  }

  async function updatePosition(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const department_id = (formData.get('department_id') as string) || null
    const headcount = parseInt(formData.get('headcount') as string) || 1
    const description = (formData.get('description') as string) || null
    await admin.from('positions').update({ title, department_id, headcount, description }).eq('id', id)
    redirect('/manage/positions')
  }

  async function toggleActive(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const id = formData.get('id') as string
    const current = formData.get('is_active') === 'true'
    await admin.from('positions').update({ is_active: !current }).eq('id', id)
    redirect('/manage/positions')
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Manage', href: '/manage' }, { label: 'Positions' }]} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Positions</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track roles and headcount planning</p>
      </div>

      {/* Add position form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 700, color: 'var(--text)', margin: '0 0 1rem' }}>Add Position</p>
        <form action={createPosition} style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input name="title" type="text" required placeholder="Position title" style={inputStyle} />
          <select name="department_id" style={inputStyle}>
            <option value="">No department</option>
            {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input name="headcount" type="number" min="1" defaultValue="1" placeholder="Headcount" style={inputStyle} />
          <input name="description" type="text" placeholder="Description (optional)" style={inputStyle} />
          <button type="submit" style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.625rem', padding: '0.625rem 1rem',
            fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
          }}>
            Add Position
          </button>
        </form>
      </div>

      {/* Positions list */}
      {(!positions || positions.length === 0) ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          No positions yet — add one above
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(positions as Array<{ id: string; title: string; department_id: string | null; headcount: number; description: string | null; is_active: boolean; departments: { name: string } | null }>).map((pos) => {
            const isEditing = editId === pos.id
            const dept = pos.departments
            const filled = pos.department_id ? (deptHeadcount.get(pos.department_id) ?? 0) : 0
            const headcount = pos.headcount
            const isActive = pos.is_active

            return (
              <div key={String(pos.id)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', overflow: 'hidden' }}>
                {isEditing ? (
                  <form action={updatePosition} style={{ padding: '1rem', display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <input type="hidden" name="id" value={pos.id} />
                    <input name="title" type="text" required defaultValue={pos.title} style={inputStyle} />
                    <select name="department_id" defaultValue={pos.department_id ?? ''} style={inputStyle}>
                      <option value="">No department</option>
                      {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input name="headcount" type="number" min="1" defaultValue={String(headcount)} style={inputStyle} />
                    <input name="description" type="text" defaultValue={pos.description ?? ''} placeholder="Description" style={inputStyle} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', flex: 1 }}>Save</button>
                      <a href="/manage/positions" style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center', flex: 1 }}>Cancel</a>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.25rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0 }}>{pos.title}</p>
                        {!isActive && (
                          <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 600 }}>Inactive</span>
                        )}
                      </div>
                      <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                        {dept?.name ?? 'No department'} · {headcount} headcount
                        {pos.description ? ` · ${pos.description}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>{filled}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.68rem', margin: 0 }}>of {headcount} filled</p>
                      </div>
                      <a href={`?edit=${pos.id}`} style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>Edit</a>
                      <form action={toggleActive}>
                        <input type="hidden" name="id" value={pos.id} />
                        <input type="hidden" name="is_active" value={String(isActive)} />
                        <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
