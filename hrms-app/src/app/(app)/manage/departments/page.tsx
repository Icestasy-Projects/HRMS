import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DepartmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin','sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data: departments } = await admin
    .from('departments')
    .select('id, name, manager_id')
    .order('name')

  const { data: allUsers } = await admin.from('users').select('id, name').eq('is_active', true).order('name')

  // Build manager name lookup
  const userMap = new Map(allUsers?.map(u => [u.id, u.name]) ?? [])

  async function createDepartment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const name = formData.get('name') as string
    const managerId = formData.get('manager_id') as string

    await supabase.from('departments').insert({
      name,
      manager_id: managerId || null,
    })

    redirect('/manage/departments')
  }

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Departments
      </h1>

      {/* Existing departments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        {(!departments || departments.length === 0) ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            No departments yet.
          </div>
        ) : departments.map(dept => (
          <div
            key={dept.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{dept.name}</p>
              {dept.manager_id && userMap.get(dept.manager_id) && (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                  Manager: {userMap.get(dept.manager_id)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create department form */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          New Department
        </h2>
        <form action={createDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Department Name
            </label>
            <input
              name="name"
              type="text"
              required
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Manager
            </label>
            <select
              name="manager_id"
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            >
              <option value="">No Manager</option>
              {allUsers?.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Create Department
          </button>
        </form>
      </div>
    </div>
  )
}
