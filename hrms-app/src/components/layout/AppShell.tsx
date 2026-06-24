'use client'

import { createClient } from '@/lib/supabase/client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type NavItem = { label: string; href: string; icon: string; badge?: number }

function getNavItems(role: string, notifCount: number): NavItem[] {
  const notif = { label: 'Notifications', href: '/notifications', icon: '🔔', badge: notifCount }
  if (role === 'super_admin') return [
    { label: 'Home', href: '/dashboard', icon: '⊞' },
    { label: 'Clock In/Out', href: '/attendance', icon: '◷' },
    { label: 'Team', href: '/team', icon: '👥' },
    { label: 'Leave Requests', href: '/team/leave', icon: '📋' },
    { label: 'My Leave', href: '/leave', icon: '🌿' },
    { label: 'Manage', href: '/manage', icon: '⚙' },
    notif,
  ]
  if (role === 'admin') return [
    { label: 'Home', href: '/dashboard', icon: '⊞' },
    { label: 'Clock In/Out', href: '/attendance', icon: '◷' },
    { label: 'Team', href: '/team', icon: '👥' },
    { label: 'Leave Requests', href: '/team/leave', icon: '📋' },
    { label: 'My Leave', href: '/leave', icon: '🌿' },
    notif,
  ]
  return [
    { label: 'Home', href: '/dashboard', icon: '⊞' },
    { label: 'Clock In/Out', href: '/attendance', icon: '◷' },
    { label: 'My Attendance', href: '/attendance/history', icon: '📅' },
    { label: 'My Leave', href: '/leave', icon: '🌿' },
    { label: 'Request Leave', href: '/leave/request', icon: '+' },
    notif,
  ]
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname()
  const { pending } = useLinkStatus()
  const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onClick}
      prefetch={false}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.5rem 0.75rem', borderRadius: '0.625rem', marginBottom: '2px',
        background: active ? 'var(--primary-l)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted)',
        fontWeight: active ? 600 : 400, fontSize: '14px', transition: 'background 0.15s',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {pending && (
        <span style={{
          width: '14px', height: '14px', border: '2px solid var(--border)',
          borderTopColor: 'var(--primary)', borderRadius: '50%', flexShrink: 0,
          display: 'inline-block',
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {!pending && item.badge && item.badge > 0 && (
        <span style={{
          background: 'var(--warning)', color: '#fff', fontSize: '11px',
          fontWeight: 700, borderRadius: '10px', padding: '1px 6px', minWidth: '20px', textAlign: 'center',
        }}>{item.badge}</span>
      )}
    </Link>
  )
}

function MobileNavLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname()
  const { pending } = useLinkStatus()
  const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <Link
      href={item.href}
      onClick={onClose}
      prefetch={false}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '2px',
        background: active ? 'var(--primary-l)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted)',
        fontWeight: active ? 600 : 400, fontSize: '15px',
        textDecoration: 'none',
      }}
    >
      <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {pending && (
        <span style={{
          width: '16px', height: '16px', border: '2px solid var(--border)',
          borderTopColor: 'var(--primary)', borderRadius: '50%', flexShrink: 0,
          display: 'inline-block',
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {!pending && item.badge && item.badge > 0 && (
        <span style={{ background: 'var(--warning)', color: '#fff', fontSize: '12px', fontWeight: 700, borderRadius: '10px', padding: '2px 7px' }}>{item.badge}</span>
      )}
    </Link>
  )
}

export default function AppShell({ employee, notifCount, children }: {
  employee: { id: string; name: string; role: string; email: string }
  notifCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navItems = getNavItems(employee.role, notifCount)
  const initials = employee.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const supabase = createClient()
  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>

      {/* Desktop Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0, display: 'none',
        flexDirection: 'column', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', position: 'sticky', top: 0, height: '100dvh',
      }} className="md-sidebar">
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0,
            }}>IC</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', lineHeight: 1.2 }}>Icestasy HRMS</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Attendance & Leave</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', borderRadius: '0.625rem', background: 'var(--surface2)', marginBottom: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--primary), #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '12px', fontWeight: 700,
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employee.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>{employee.role.replace('_', ' ')}</div>
            </div>
          </div>
          <button onClick={signOut} style={{
            width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer',
          }}>Sign out</button>
        </div>
      </aside>

      {/* Mobile header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem', height: '56px', boxShadow: 'var(--shadow)',
      }} className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '12px',
          }}>IC</div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>Icestasy HRMS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {notifCount > 0 && (
            <Link href="/notifications" prefetch={false} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <span style={{
                position: 'absolute', top: 4, right: 4, background: 'var(--warning)', color: '#fff',
                fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '0 4px', minWidth: '16px', textAlign: 'center',
              }}>{notifCount}</span>
            </Link>
          )}
          <button onClick={() => setOpen(o => !o)} style={{
            width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}>
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: '20px', height: '2px', background: 'var(--text)', borderRadius: '2px' }} />)}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,13,46,0.4)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '280px',
            background: 'var(--surface)', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-md)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--primary), #a855f7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '14px', fontWeight: 700,
              }}>{initials}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{employee.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'capitalize' }}>{employee.role.replace('_', ' ')}</div>
              </div>
            </div>
            <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
              {navItems.map(item => (
                <MobileNavLink key={item.href} item={item} onClose={() => setOpen(false)} />
              ))}
            </nav>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={signOut} style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--muted)', fontSize: '14px', cursor: 'pointer',
              }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '1rem', paddingTop: 'calc(56px + 1rem)' }} className="main-content">
        {children}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-header { display: none !important; }
          .main-content { padding-top: 1.5rem !important; padding-left: 1.5rem; padding-right: 1.5rem; }
        }
      `}</style>
    </div>
  )
}
