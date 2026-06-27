import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!employee) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', employee.id)
    .order('created_at', { ascending: false })

  async function markAllRead() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('users').select('id').eq('email', user.email).single()
    if (!emp) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', emp.id)
      .eq('is_read', false)

    redirect('/notifications')
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.25rem' }}>Home / Notifications</p>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                display: 'inline-block', marginLeft: '0.625rem',
                background: '#f59e0b', color: '#fff', fontSize: '13px', fontWeight: 700,
                borderRadius: '999px', padding: '1px 8px', verticalAlign: 'middle',
              }}>{unreadCount}</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button type="submit" style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '0.5rem', padding: '0.5rem 1rem',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '0.875rem',
              minHeight: '44px',
            }}>
              Mark all read
            </button>
          </form>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2.5rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🔔</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No notifications</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>You&apos;re all caught up!</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
        }}>
          {notifications.map((notif, idx) => {
            const isAction = notif.type === 'action_needed'
            const badgeColor = isAction ? 'var(--warning)' : 'var(--muted)'

            return (
              <div
                key={notif.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  borderLeft: isAction ? '3px solid var(--warning)' : '3px solid transparent',
                  opacity: notif.is_read ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.375rem' }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{notif.title}</p>
                  <span style={{
                    background: `${badgeColor}18`, color: badgeColor,
                    border: `1px solid ${badgeColor}`,
                    borderRadius: '999px', padding: '0.2rem 0.6rem',
                    fontSize: '0.72rem', fontWeight: 600,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {isAction ? 'Action Needed' : 'FYI'}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>{notif.message}</p>
                {isAction && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link href="/team/leave" style={{
                      background: 'rgba(245,158,11,0.12)', color: 'var(--warning)',
                      border: '1px solid var(--warning)', borderRadius: '0.5rem',
                      padding: '0.375rem 0.875rem', fontSize: '0.8rem', fontWeight: 600,
                    }}>
                      Review Requests
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
