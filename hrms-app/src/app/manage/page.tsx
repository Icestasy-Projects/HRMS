import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const tiles = [
  { label: 'Employees', href: '/manage/employees', desc: 'View and manage all staff' },
  { label: 'Add Employee', href: '/manage/employees/new', desc: 'Onboard a new team member' },
  { label: 'Departments', href: '/manage/departments', desc: 'Manage departments and managers' },
  { label: 'Leave Policy', href: '/manage/policy', desc: 'Configure leave entitlements' },
  { label: 'Holidays', href: '/manage/holidays', desc: 'Manage public holidays' },
]

export default async function ManagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single()

  if (!employee || employee.role !== 'super_admin') redirect('/dashboard')

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Manage
      </h1>

      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {tiles.map(tile => (
          <Link
            key={tile.href}
            href={tile.href}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.25rem',
              textDecoration: 'none',
              display: 'block',
            }}
          >
            <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '1rem' }}>{tile.label}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.375rem 0 0' }}>{tile.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
