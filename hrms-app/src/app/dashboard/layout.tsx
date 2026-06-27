import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('id', user.id).single()

  if (!employee) {
    async function signOut() {
      'use server'
      const s = await createClient()
      await s.auth.signOut()
      redirect('/login')
    }
    return (
      <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'1rem' }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'1rem', padding:'2rem', maxWidth:'400px', textAlign:'center', boxShadow:'var(--shadow-md)' }}>
          <div style={{ fontSize:'48px', marginBottom:'1rem' }}>⚠️</div>
          <h2 style={{ color:'var(--danger)', marginBottom:'0.5rem', fontSize:'1.25rem', fontWeight:700 }}>Account Not Found</h2>
          <p style={{ color:'var(--muted)', marginBottom:'1.5rem', fontSize:'14px', lineHeight:1.6 }}>
            No employee record found for <strong>{user.email}</strong>.<br/>Please contact your HR administrator.
          </p>
          <form action={signOut}>
            <button type="submit" style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'0.75rem', padding:'0.75rem 1.5rem', color:'var(--text)', cursor:'pointer', fontWeight:600 }}>
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { count: notifCount } = await supabase
    .from('notifications').select('*', { count:'exact', head:true })
    .eq('recipient_id', employee.id).eq('is_read', false)

  return <AppShell role={employee.role} userName={employee.name} notifCount={notifCount ?? 0}>{children}</AppShell>
}
