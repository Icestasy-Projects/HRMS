import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'
import type { ReactNode } from 'react'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee, error } = await supabase
    .from('users')
    .select('*, department:departments(id, name, manager_id, created_at)')
    .eq('email', user.email)
    .single()

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account not found</h1>
          <p className="text-gray-600 text-sm">
            Your account has not been set up in the system yet. Please contact your HR administrator.
          </p>
          <form action="/api/auth/signout" method="POST" className="mt-4">
            <button
              type="submit"
              className="bg-gray-100 text-gray-700 rounded-lg px-5 py-3 font-semibold hover:bg-gray-200"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Fetch unread notification count
  const { count: notificationCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', employee.id)
    .eq('is_read', false)

  return (
    <AppShell employee={employee} notificationCount={notificationCount ?? 0}>
      {children}
    </AppShell>
  )
}
