import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!employee) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', employee.id)
    .order('created_at', { ascending: false })

  const actionItems = (notifications ?? []).filter(n => n.requires_action)
  const fyiItems = (notifications ?? []).filter(n => !n.requires_action)
  const hasUnread = (notifications ?? []).some(n => !n.is_read)

  async function markAllRead() {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: employee } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!employee) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', employee.id)
      .eq('is_read', false)

    revalidatePath('/notifications')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Messages and alerts for you. Items marked &ldquo;Action needed&rdquo; require a decision from you.
          </p>
        </div>
        {hasUnread && (
          <form action={markAllRead}>
            <button
              type="submit"
              className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 font-semibold hover:bg-gray-200 text-sm min-h-[44px] shrink-0"
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      {/* Action-needed */}
      {actionItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Needs Your Action</h2>
          <div className="space-y-2">
            {actionItems.map(n => (
              <div
                key={n.id}
                className={`bg-amber-50 border border-amber-200 rounded-xl p-4 ${!n.is_read ? 'border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs font-semibold">Action needed</span>
                      {!n.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />}
                    </div>
                    <p className="text-sm text-gray-900">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(n.created_at), 'd MMM yyyy, HH:mm')}</p>
                  </div>
                  {n.leave_request_id && (
                    <Link
                      href="/team/leave"
                      className="bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-blue-800 shrink-0 min-h-[44px] flex items-center"
                    >
                      Review
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FYI items */}
      {fyiItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">For Your Information</h2>
          <div className="space-y-2">
            {fyiItems.map(n => (
              <div
                key={n.id}
                className={`bg-white border border-gray-200 rounded-xl p-4 ${!n.is_read ? 'border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs font-semibold">FYI</span>
                      {!n.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />}
                    </div>
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{format(new Date(n.created_at), 'd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!notifications || notifications.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No notifications yet. You&apos;re all caught up.
        </div>
      )}
    </div>
  )
}
