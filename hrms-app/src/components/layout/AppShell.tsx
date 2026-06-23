'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type NavItem = { label: string; href: string; badge?: number }

function getNavItems(role: string, notifCount: number): NavItem[] {
  const notif = { label: 'Notifications', href: '/notifications', badge: notifCount }
  if (role === 'super_admin') {
    return [
      { label: 'Home', href: '/dashboard' },
      { label: 'Clock In/Out', href: '/attendance' },
      { label: 'Team', href: '/team' },
      { label: 'Leave Requests', href: '/team/leave' },
      { label: 'My Leave', href: '/leave' },
      { label: 'Manage', href: '/manage' },
      notif,
    ]
  }
  if (role === 'admin') {
    return [
      { label: 'Home', href: '/dashboard' },
      { label: 'Clock In/Out', href: '/attendance' },
      { label: 'My Team', href: '/team' },
      { label: 'Leave Requests', href: '/team/leave' },
      { label: 'My Leave', href: '/leave' },
      notif,
    ]
  }
  return [
    { label: 'Home', href: '/dashboard' },
    { label: 'Clock In/Out', href: '/attendance' },
    { label: 'Attendance', href: '/attendance/history' },
    { label: 'My Leave', href: '/leave' },
    { label: 'Request Leave', href: '/leave/request' },
    notif,
  ]
}

interface AppShellProps {
  children: React.ReactNode
  role: string
  userName: string
  notifCount: number
}

export default function AppShell({ children, role, userName, notifCount }: AppShellProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = getNavItems(role, notifCount)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {navItems.map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 0.875rem',
            borderRadius: '0.75rem',
            textDecoration: 'none',
            color: pathname === item.href ? 'var(--text)' : 'var(--muted)',
            background: pathname === item.href ? 'var(--surface2)' : 'transparent',
            fontWeight: pathname === item.href ? 600 : 400,
            fontSize: '0.9375rem',
            transition: 'background 0.15s',
          }}
        >
          {item.label}
          {item.badge && item.badge > 0 ? (
            <span
              style={{
                background: 'var(--primary)',
                color: 'var(--text)',
                borderRadius: '999px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem 1rem',
          position: 'sticky',
          top: 0,
          height: '100dvh',
        }}
        className="hidden-mobile"
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>Icestasy HRMS</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          <NavLinks />
        </nav>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{userName}</p>
          <button
            onClick={signOut}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.5rem 1rem',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              width: '100%',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 100,
        }}
        className="show-mobile"
      >
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>Icestasy HRMS</span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            lineHeight: 1,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '280px',
              height: '100%',
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              padding: '4.5rem 1rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
              <NavLinks onClick={() => setMenuOpen(false)} />
            </nav>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{userName}</p>
              <button
                onClick={signOut}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  width: '100%',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        style={{
          flex: 1,
          padding: '1.5rem',
          paddingTop: 'calc(56px + 1.5rem)',
          overflowY: 'auto',
        }}
        className="main-content"
      >
        {children}
      </main>

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
          .main-content { padding-top: 1.5rem !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
