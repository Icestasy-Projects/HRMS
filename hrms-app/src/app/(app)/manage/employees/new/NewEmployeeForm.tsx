'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Department = { id: string; name: string }
type Manager = { id: string; name: string; role: string }

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.75rem',
  padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  fontSize: '0.9rem',
}

export default function NewEmployeeForm({
  departments,
  managers,
}: {
  departments: Department[]
  managers: Manager[]
}) {
  const router = useRouter()
  const [role, setRole] = useState('employee')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const superAdmins = managers.filter(m => m.role === 'super_admin')
  const defaultManagerId = superAdmins[0]?.id ?? ''

  // super_admin = no manager; admin/sub_super_admin = auto super_admin; employee = pick from list
  const showManagerPicker = role === 'employee'
  const noManager = role === 'super_admin'
  const autoManager = role === 'admin' || role === 'sub_super_admin'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    if (autoManager) {
      data.set('manager_id', defaultManagerId)
    } else if (noManager) {
      data.set('manager_id', '')
    }

    const res = await fetch('/api/employees/create', {
      method: 'POST',
      body: data,
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Failed to create employee')
      setLoading(false)
      return
    }

    router.push('/manage/employees')
    router.refresh()
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Full Name</label>
          <input name="name" type="text" required style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Email</label>
          <input name="email" type="email" required style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Phone</label>
          <input name="phone" type="tel" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Role</label>
          <select name="role" required value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
            <option value="sub_super_admin">Sub Super Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {showManagerPicker && (
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Manager</label>
            <select name="manager_id" style={inputStyle}>
              <option value="">No Manager</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role === 'super_admin' ? 'Super Admin' : m.role === 'sub_super_admin' ? 'Sub Super Admin' : 'Admin'})
                </option>
              ))}
            </select>
          </div>
        )}

        {autoManager && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
              Manager: <strong style={{ color: 'var(--text)' }}>{superAdmins[0]?.name ?? 'Super Admin'} (Super Admin)</strong> — auto-assigned
            </p>
          </div>
        )}

        {noManager && (
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)' }}>
              Manager: <strong style={{ color: 'var(--text)' }}>None</strong> — top of hierarchy
            </p>
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Department</label>
          <select name="department_id" style={inputStyle}>
            <option value="">No Department</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>Employee Type</label>
          <select name="employee_type" required style={inputStyle}>
            <option value="white_collar">White Collar</option>
            <option value="blue_collar">Blue Collar</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
            fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '0.25rem',
          }}
        >
          {loading ? 'Creating...' : 'Create Employee'}
        </button>
      </form>
    </div>
  )
}
