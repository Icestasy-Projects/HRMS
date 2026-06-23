import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
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
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', emp.id).eq('is_read', false)
    revalidatePath('/notifications')
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button type="submit" className="text-sm font-medium hover:underline" style={{ color: 'var(--primary-h)' }}>
              Mark all read
            </button>
          </form>
        )}
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const isActionNeeded = n.type === 'leave_request_pending'
            return (
              <div key={n.id} className="rounded-2xl border p-4"
                style={{
                  background: !n.is_read ? (isActionNeeded ? 'rgba(245,158,11,0.08)' : 'var(--surface)') : 'var(--surface)',
                  borderColor: !n.is_read ? (isActionNeeded ? 'rgba(245,158,11,0.4)' : 'var(--primary)') : 'var(--border)',
                  opacity: n.is_read ? 0.6 : 1,
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isActionNeeded && !n.is_read && (
                        <span className="text-xs font-bold rounded-full px-2 py-0.5" style={{ background: 'var(--warning)', color: '#000' }}>Action needed</span>
                      )}
                      {!isActionNeeded && !n.is_read && (
                        <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>FYI</span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{n.message}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {format(new Date(n.created_at), 'd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: isActionNeeded ? 'var(--warning)' : 'var(--primary)' }}></div>
                  )}
                </div>
                {isActionNeeded && !n.is_read && (
                  <a href="/team/leave" className="inline-block mt-3 rounded-lg px-4 py-2 text-sm font-semibold"
                    style={{ background: 'var(--warning)', color: '#000' }}>Review Requests</a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
