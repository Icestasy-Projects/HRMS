'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Employee = { id: string; name: string; role: string; email: string }

const NAV = {
  employee: [
    { href: '/dashboard',          label: 'Home',           icon: '⌂' },
    { href: '/attendance',         label: 'Clock In/Out',   icon: '◷' },
    { href: '/attendance/history', label: 'Attendance',     icon: '📋' },
    { href: '/leave',              label: 'My Leave',       icon: '🌿' },
    { href: '/leave/request',      label: 'Request Leave',  icon: '+' },
    { href: '/notifications',      label: 'Notifications',  icon: '🔔' },
  ],
  admin: [
    { href: '/dashboard',          label: 'Home',           icon: '⌂' },
    { href: '/attendance',         label: 'Clock In/Out',   icon: '◷' },
    { href: '/team',               label: 'My Team',        icon: '👥' },
    { href: '/team/leave',         label: 'Leave Requests', icon: '📝' },
    { href: '/leave',              label: 'My Leave',       icon: '🌿' },
    { href: '/notifications',      label: 'Notifications',  icon: '🔔' },
  ],
  super_admin: [
    { href: '/dashboard',          label: 'Home',           icon: '⌂' },
    { href: '/attendance',         label: 'Clock In/Out',   icon: '◷' },
    { href: '/team',               label: 'Team',           icon: '👥' },
    { href: '/team/leave',         label: 'Leave Requests', icon: '📝' },
    { href: '/manage',             label: 'Manage',         icon: '⚙' },
    { href: '/notifications',      label: 'Notifications',  icon: '🔔' },
  ],
}

export default function AppShell({ employee, notificationCount, children }: {
  employee: Employee; notificationCount: number; children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const role = (employee.role as keyof typeof NAV) in NAV ? employee.role as keyof typeof NAV : 'employee'
  const navItems = NAV[role]
  const initials = employee.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function NavLink({ item }: { item: typeof navItems[0] }) {
    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    return (
      <Link href={item.href} onClick={() => setOpen(false)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
        style={{ background: active ? 'var(--primary)' : 'transparent', color: active ? '#fff' : 'var(--muted)' }}>
        <span className="w-5 text-center text-base">{item.icon}</span>
        <span>{item.label}</span>
        {item.href === '/notifications' && notificationCount > 0 && (
          <span className="ml-auto text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
            style={{ background: 'var(--warning)', color: '#000' }}>{notificationCount}</span>
        )}
      </Link>
    )
  }

  const UserBlock = () => (
    <div className="px-4 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: 'var(--primary)' }}>{initials}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{employee.name}</div>
          <div className="text-xs truncate capitalize" style={{ color: 'var(--muted)' }}>{employee.role.replace('_', ' ')}</div>
        </div>
      </div>
      <button onClick={signOut} className="w-full text-sm rounded-lg px-3 py-2 font-medium text-left transition-colors"
        style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Sign out</button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg)' }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'var(--primary)' }}>IC</div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>Icestasy HRMS</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>Attendance & Leave</div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => <NavLink key={item.href} item={item} />)}
        </nav>
        <UserBlock />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
            style={{ background: 'var(--primary)' }}>IC</div>
          <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Icestasy HRMS</span>
        </div>
        <div className="flex items-center gap-1">
          {notificationCount > 0 && (
            <Link href="/notifications" className="relative flex items-center justify-center w-10 h-10">
              <span>🔔</span>
              <span className="absolute -top-0.5 -right-0.5 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center"
                style={{ background: 'var(--warning)', color: '#000' }}>{notificationCount}</span>
            </Link>
          )}
          <button onClick={() => setOpen(o => !o)} className="w-10 h-10 flex flex-col items-center justify-center gap-1.5">
            <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text)' }}></span>
            <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text)' }}></span>
            <span className="block w-5 h-0.5 rounded" style={{ background: 'var(--text)' }}></span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col" style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'var(--primary)' }}>{initials}</div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{employee.name}</div>
                <div className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{employee.role.replace('_', ' ')}</div>
              </div>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
              {navItems.map(item => <NavLink key={item.href} item={item} />)}
            </nav>
            <UserBlock />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 md:p-6 pb-8">{children}</main>
    </div>
  )
}
