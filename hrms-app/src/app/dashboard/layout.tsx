import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!employee) {
    async function signOut() {
      'use server'
      const supabase = await createClient()
      await supabase.auth.signOut()
      redirect('/login')
    }

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Account Not Found</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            No employee record found for {user.email}. Please contact your administrator.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { count: notifCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', employee.id)
    .eq('is_read', false)

  return (
    <AppShell
      role={employee.role}
      userName={employee.name}
      notifCount={notifCount ?? 0}
    >
      {children}
    </AppShell>
  )
}
