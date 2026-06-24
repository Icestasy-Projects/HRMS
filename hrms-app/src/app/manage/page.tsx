import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const tiles = [
  { label: 'Employees', href: '/manage/employees', desc: 'View and manage all staff', icon: '👥' },
  { label: 'Add Employee', href: '/manage/employees/new', desc: 'Onboard a new team member', icon: '➕' },
  { label: 'Departments', href: '/manage/departments', desc: 'Manage departments and managers', icon: '🏢' },
  { label: 'Leave Policy', href: '/manage/policy', desc: 'Configure leave entitlements', icon: '📋' },
  { label: 'Holidays', href: '/manage/holidays', desc: 'Manage public holidays', icon: '📅' },
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
      <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1.75rem', letterSpacing: '-0.02em' }}>
        Manage
      </h1>

      <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {tiles.map(tile => (
          <Link
            key={tile.href}
            href={tile.href}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1.125rem',
              padding: '1.375rem',
              textDecoration: 'none',
              display: 'block',
              boxShadow: 'var(--shadow)',
              transition: 'box-shadow 0.15s',
            }}
          >
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.625rem' }}>{tile.icon}</span>
            <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0, fontSize: '0.975rem' }}>{tile.label}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>{tile.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
