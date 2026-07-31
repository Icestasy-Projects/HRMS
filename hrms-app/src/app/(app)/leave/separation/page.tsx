import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { todayIST } from '@/lib/attendance'
import SeparationForm from './SeparationForm'

export const dynamic = 'force-dynamic'

export default async function SeparationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('id, name, role').eq('id', user.id).single()
  if (!employee) redirect('/login')

  const admin = createAdminClient()

  const { data: existing, error: sepError } = await admin
    .from('separation_requests')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sepError && sepError.code === '42P01') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Leave', href: '/leave' }, { label: 'Separation Request' }]} />
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '0.875rem', padding: '1.5rem', marginTop: '1rem' }}>
          <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 0.5rem' }}>Setup required</p>
          <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0 }}>
            The <code>separation_requests</code> table has not been created yet. Please run the setup SQL in your Supabase SQL Editor.
          </p>
        </div>
      </div>
    )
  }

  async function submitSeparation(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const type = formData.get('type') as string
    if (!type) return
    const reason = formData.get('reason') as string
    const sabbaticalFrom = formData.get('sabbatical_from') as string | null
    const sabbaticalTo = formData.get('sabbatical_to') as string | null

    await admin.from('separation_requests').insert({
      employee_id: user.id,
      type,
      reason,
      sabbatical_from: type === 'sabbatical' ? sabbaticalFrom : null,
      sabbatical_to: type === 'sabbatical' ? sabbaticalTo : null,
      status: 'pending',
    })

    redirect('/leave/separation')
  }

  async function withdrawRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()
    const id = formData.get('id') as string
    await admin.from('separation_requests').delete().eq('id', id).eq('employee_id', user.id).eq('status', 'pending')
    redirect('/leave/separation')
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Leave', href: '/leave' }, { label: 'Separation Request' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Separation Request
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Apply for resignation or sabbatical leave — subject to HR approval
        </p>
      </div>

      <SeparationForm
        submitSeparation={submitSeparation}
        withdrawRequest={withdrawRequest}
        existing={existing}
        todayStr={todayIST()}
      />
    </div>
  )
}
