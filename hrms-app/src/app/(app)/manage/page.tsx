import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, UserPlus, Building2, Rocket, Pin, ClipboardList, CalendarDays,
} from 'lucide-react'

const tiles = [
  { label: 'Employees',    href: '/manage/employees',     desc: 'View and manage all staff',          Icon: Users },
  { label: 'Add Employee', href: '/manage/employees/new', desc: 'Onboard a new team member',          Icon: UserPlus },
  { label: 'Departments',  href: '/manage/departments',   desc: 'Manage departments and managers',    Icon: Building2 },
  { label: 'Onboarding',   href: '/manage/onboarding',    desc: 'Templates and new hire progress',    Icon: Rocket },
  { label: 'Positions',    href: '/manage/positions',     desc: 'Track roles and headcount planning', Icon: Pin },
  { label: 'Leave Policy', href: '/manage/policy',        desc: 'Configure leave entitlements',       Icon: ClipboardList },
  { label: 'Holidays',     href: '/manage/holidays',      desc: 'Manage public holidays',             Icon: CalendarDays },
]

export default async function ManagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!employee || !['super_admin', 'sub_super_admin'].includes(employee.role)) redirect('/dashboard')

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Manage' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Manage
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>System configuration and HR administration</p>
      </div>

      <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {tiles.map(({ label, href, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', padding: '1.375rem',
              textDecoration: 'none', display: 'block',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
              background: 'var(--primary-l)', marginBottom: '0.75rem',
            }}>
              <Icon size={20} color="var(--primary)" strokeWidth={1.75} />
            </div>
            <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0, fontSize: '0.975rem' }}>{label}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.25rem 0 0', lineHeight: 1.4 }}>{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
