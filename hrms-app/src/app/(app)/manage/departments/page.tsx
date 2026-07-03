import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.75rem',
  padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box' as const,
}

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit: editId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  async function createDepartment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const name = formData.get('name') as string
    const description = (formData.get('description') as string) || null
    await supabase.from('departments').insert({ name, description })
    redirect('/manage/departments')
  }

  async function updateDepartment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = (formData.get('description') as string) || null
    await supabase.from('departments').update({ name, description }).eq('id', id)
    redirect('/manage/departments')
  }

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
        Departments
      </h1>

      {deptError && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.75rem', padding: '0.875rem 1rem', color: '#991b1b', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Error: {deptError.message}
        </div>
      )}

      {/* Department list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
        {(!departments || departments.length === 0) ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', color: 'var(--muted)',
          }}>
            No departments yet.
          </div>
        ) : departments.map(dept => {
          const isEditing = editId === dept.id
          return (
            <div key={dept.id} style={{
              background: 'var(--surface)', border: `1px solid ${isEditing ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: '1rem', overflow: 'hidden',
            }}>
              {/* Department row */}
              <div style={{
                padding: '0.875rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{dept.name}</p>
                  {dept.description && (
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{dept.description}</p>
                  )}
                </div>
                <a href={isEditing ? '/manage/departments' : `/manage/departments?edit=${dept.id}`}
                  style={{
                    background: isEditing ? 'var(--surface2)' : 'var(--primary-l)',
                    color: isEditing ? 'var(--muted)' : 'var(--primary)',
                    border: `1px solid ${isEditing ? 'var(--border)' : 'var(--primary)'}`,
                    borderRadius: '0.5rem', padding: '0.375rem 0.875rem',
                    fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </a>
              </div>

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', background: 'var(--surface2)' }}>
                  <form action={updateDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <input type="hidden" name="id" value={dept.id} />
                    <div>
                      <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>Department Name</label>
                      <input name="name" type="text" required defaultValue={dept.name} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>Description</label>
                      <input name="description" type="text" defaultValue={dept.description ?? ''} style={inputStyle} />
                    </div>
                    <button type="submit" style={{
                      background: 'var(--primary)', color: '#fff', border: 'none',
                      borderRadius: '0.75rem', padding: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', minHeight: '44px',
                    }}>
                      Save Changes
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create department form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
        <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', margin: '0 0 1rem' }}>
          New Department
        </h2>
        <form action={createDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Department Name</label>
            <input name="name" type="text" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Description</label>
            <input name="description" type="text" style={inputStyle} />
          </div>
          <button type="submit" style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 600,
            cursor: 'pointer', minHeight: '44px',
          }}>
            Create Department
          </button>
        </form>
      </div>
    </div>
  )
}
