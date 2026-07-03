'use client'

import { createClient } from '@/lib/supabase/client'
import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import NavProgress from '@/components/NavProgress'

type NavItem = { label: string; href: string; badge?: number }

function getNavItems(role: string): NavItem[] {
  if (role === 'super_admin') return [
    { label: 'Home', href: '/dashboard' },
    { label: 'Team', href: '/team' },
    { label: 'Manage', href: '/manage' },
  ]
  if (role === 'sub_super_admin') return [
    { label: 'Home', href: '/dashboard' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Leave', href: '/leave' },
    { label: 'Team', href: '/team' },
    { label: 'Manage', href: '/manage' },
  ]
  if (role === 'admin') return [
    { label: 'Home', href: '/dashboard' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Leave', href: '/leave' },
    { label: 'Team', href: '/team' },
  ]
  return [
    { label: 'Home', href: '/dashboard' },
    { label: 'Attendance', href: '/attendance' },
    { label: 'Leave', href: '/leave' },
    { label: 'Calendar', href: '/team/calendar' },
  ]
}

function TopNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const { pending } = useLinkStatus()
  const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      prefetch={false}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.375rem',
        padding: '0 0.875rem', height: '56px',
        color: active ? '#fff' : 'rgba(255,255,255,0.72)',
        fontWeight: active ? 600 : 400, fontSize: '14px',
        textDecoration: 'none',
        borderBottom: active ? '3px solid #fff' : '3px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {item.label}
      {pending && (
        <span style={{
          width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff', borderRadius: '50%',
          display: 'inline-block', animation: 'spin 0.6s linear infinite',
        }} />
      )}
    </Link>
  )
}

function DrawerNavLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname()
  const { pending } = useLinkStatus()
  const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      onClick={onClose}
      prefetch={false}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1rem', borderRadius: '0.625rem', marginBottom: '2px',
        background: active ? 'var(--primary-l)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--text)',
        fontWeight: active ? 600 : 400, fontSize: '15px',
        textDecoration: 'none',
      }}
    >
      <span>{item.label}</span>
      {pending && (
        <span style={{
          width: '14px', height: '14px', border: '2px solid var(--border)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          display: 'inline-block', animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {!pending && item.badge && item.badge > 0 && (
        <span style={{
          background: '#f59e0b', color: '#fff', fontSize: '11px',
          fontWeight: 700, borderRadius: '999px', padding: '1px 7px',
          minWidth: '20px', textAlign: 'center',
        }}>{item.badge}</span>
      )}
    </Link>
  )
}

function BottomNavLink({ item, icon, notifCount }: { item: NavItem; icon: string; notifCount: number }) {
  const pathname = usePathname()
  const { pending } = useLinkStatus()
  const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      prefetch={false}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0.5rem 0.25rem', gap: '0.25rem', textDecoration: 'none', position: 'relative',
        color: active ? 'var(--primary)' : 'var(--muted)',
        minHeight: '56px',
      }}
    >
      <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{pending ? '·' : icon}</span>
      <span style={{ fontSize: '0.62rem', fontWeight: active ? 700 : 400, letterSpacing: '0.01em' }}>{item.label}</span>
      {notifCount > 0 && (
        <span style={{
          position: 'absolute', top: '6px', right: 'calc(50% - 16px)',
          background: '#f59e0b', color: '#fff', fontSize: '9px', fontWeight: 700,
          borderRadius: '999px', padding: '0 4px', minWidth: '14px', height: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{notifCount}</span>
      )}
    </Link>
  )
}

interface AppShellProps {
  children: React.ReactNode
  role: string
  userName: string
  notifCount: number
}

export default function AppShell({ children, role, userName, notifCount }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const navItems = getNavItems(role)
  const initials = userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <NavProgress />

      {/* Fixed top header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '56px',
        background: 'linear-gradient(135deg, #5b1fa8 0%, #7c2fc9 55%, #9b4de0 100%)',
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 2px 8px rgba(91,31,168,0.35)',
      }}>
        {/* Left: hamburger + logo */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.875rem', gap: '0.375rem', flexShrink: 0 }}>
          <button
            onClick={() => setDrawerOpen(o => !o)}
            className="ham-btn"
            style={{
              width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
              borderRadius: '0.5rem',
            }}
            aria-label="Open menu"
          >
            {[0,1,2].map(i => <span key={i} style={{ display: 'block', width: '18px', height: '2px', background: '#fff', borderRadius: '2px' }} />)}
          </button>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '12px', flexShrink: 0,
            }}>IC</div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff', letterSpacing: '-0.01em' }}>Icestasy</span>
          </Link>
        </div>

        {/* Center: nav tabs — desktop only */}
        <nav className="top-nav" style={{ flex: 1, display: 'none', alignItems: 'stretch', paddingLeft: '1.25rem' }}>
          {navItems.map(item => (
            <TopNavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Right: bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: '0.875rem', gap: '0.25rem', marginLeft: 'auto' }}>
          <Link href="/notifications" prefetch={false} style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '0.5rem',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: '5px', right: '5px',
                background: '#f59e0b', color: '#fff',
                fontSize: '10px', fontWeight: 700, borderRadius: '999px',
                padding: '0 4px', minWidth: '16px', height: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{notifCount}</span>
            )}
          </Link>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setAvatarMenuOpen(o => !o)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
                color: '#fff', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {initials}
            </button>
            {avatarMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setAvatarMenuOpen(false)} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                  background: 'var(--surface)', borderRadius: '0.75rem',
                  boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
                  minWidth: '200px', overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', margin: 0 }}>{userName}</p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'capitalize', margin: '2px 0 0' }}>{role.replace('_', ' ')}</p>
                  </div>
                  <div style={{ padding: '0.375rem' }}>
                    <Link href="/profile" onClick={() => setAvatarMenuOpen(false)} style={{
                      display: 'block', width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                      color: 'var(--text)', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
                    }}>
                      Change Password
                    </Link>
                    <button onClick={signOut} style={{
                      width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                      border: 'none', background: 'transparent', color: 'var(--danger)',
                      fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    }}>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,13,46,0.45)', backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '280px',
            background: 'var(--surface)', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-md)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #5b1fa8, #7c2fc9)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '14px', fontWeight: 700,
              }}>{initials}</div>
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{userName}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>{role.replace('_', ' ')}</div>
              </div>
            </div>
            <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
              {navItems.map(item => (
                <DrawerNavLink key={item.href} item={item} onClose={() => setDrawerOpen(false)} />
              ))}
              <DrawerNavLink
                item={{ label: 'Notifications', href: '/notifications', badge: notifCount }}
                onClose={() => setDrawerOpen(false)}
              />
            </nav>
            <div style={{ padding: '0.875rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={signOut} style={{
                width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--danger)', fontSize: '14px', cursor: 'pointer', fontWeight: 500,
              }}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ paddingTop: '56px', minHeight: '100dvh' }}>
        <div style={{ padding: '1.25rem 1rem 5rem' }} className="main-inner">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav" style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -2px 12px rgba(124,47,201,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {navItems.slice(0, 4).map(item => {
          const icons: Record<string, string> = {
            '/dashboard': '⊞',
            '/attendance': '◷',
            '/leave': '🌿',
            '/team': '👥',
            '/manage': '⚙',
            '/notifications': '🔔',
          }
          return (
            <BottomNavLink key={item.href} item={item} icon={icons[item.href] ?? '●'} notifCount={0} />
          )
        })}
        <BottomNavLink item={{ label: 'Alerts', href: '/notifications' }} icon="🔔" notifCount={notifCount} />
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 768px) {
          .ham-btn { display: none !important; }
          .top-nav { display: flex !important; }
          .main-inner { padding: 1.75rem 2rem 1.75rem !important; }
        }
        @media (max-width: 767px) {
          .bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
