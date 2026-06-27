'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Dept { id: string; name: string }

export default function TeamFilter({ departments, currentDept }: { departments: Dept[]; currentDept?: string }) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const url = val ? `${pathname}?dept=${val}` : pathname
    router.push(url)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        defaultValue={currentDept ?? ''}
        onChange={handleChange}
        style={{
          appearance: 'none',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.625rem',
          padding: '0.625rem 2.5rem 0.625rem 0.875rem',
          color: 'var(--text)',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none',
          minHeight: '44px',
          boxShadow: 'var(--shadow)',
          minWidth: '160px',
        }}
      >
        <option value="">All Departments</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: 'var(--muted)', fontSize: '0.75rem',
      }}>▾</span>
    </div>
  )
}
