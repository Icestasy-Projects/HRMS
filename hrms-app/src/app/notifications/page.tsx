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
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Notifications
        </h1>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button
              type="submit"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.5rem 1rem',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          No notifications.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {notifications.map(notif => {
            const isAction = notif.type === 'action_needed'
            const borderColor = isAction ? 'var(--warning)' : 'var(--border)'
            const badgeColor = isAction ? 'var(--warning)' : 'var(--muted)'

            return (
              <div
                key={notif.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  opacity: notif.is_read ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.375rem' }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{notif.title}</p>
                  <span
                    style={{
                      background: `${badgeColor}20`,
                      color: badgeColor,
                      border: `1px solid ${badgeColor}`,
                      borderRadius: '0.5rem',
                      padding: '0.2rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isAction ? 'Action Needed' : 'FYI'}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>{notif.message}</p>
                {isAction && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <Link
                      href="/team/leave"
                      style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: 'var(--warning)',
                        border: '1px solid var(--warning)',
                        borderRadius: '0.5rem',
                        padding: '0.375rem 0.875rem',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
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
