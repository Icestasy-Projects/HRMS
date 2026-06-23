import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const tiles = [
    { href: '/manage/employees', label: 'Employees', desc: 'View and manage all staff accounts', icon: '👤' },
    { href: '/manage/employees/new', label: 'Add Employee', desc: 'Create a new staff account', icon: '+' },
    { href: '/manage/departments', label: 'Departments', desc: 'Manage teams and assign managers', icon: '🏢' },
    { href: '/manage/policy', label: 'Leave Policy', desc: 'Adjust annual leave rules and deductions', icon: '📋' },
    { href: '/manage/holidays', label: 'Holidays', desc: 'Set public holidays for this year', icon: '📅' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Manage</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Company-wide settings and employee management.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tiles.map(t => (
          <Link key={t.href} href={t.href} className="rounded-2xl border p-5 flex items-start gap-4 transition-colors"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(139,47,201,0.15)', color: 'var(--primary-h)' }}>{t.icon}</div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{t.label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
