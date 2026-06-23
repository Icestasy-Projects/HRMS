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
    .select('*, department:departments(id, name, manager_id)')
    .eq('email', user.email)
    .single()

  if (error || !employee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="rounded-2xl border p-8 max-w-sm w-full text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Account not found</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Your account has not been set up in the system yet. Please contact your HR administrator.
          </p>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="rounded-xl px-5 py-3 font-semibold text-sm"
              style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>Sign out</button>
          </form>
        </div>
      </div>
    )
  }

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
