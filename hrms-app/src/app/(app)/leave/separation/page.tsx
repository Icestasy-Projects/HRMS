import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { todayIST } from '@/lib/attendance'
import SeparationForm from './SeparationForm'

export const dynamic = 'force-dynamic'

export default async function SeparationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMsg = params?.error ?? null

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
    if (!type) redirect('/leave/separation?error=Please+select+a+request+type')
    const reason = (formData.get('reason') as string) || null
    const sabbaticalFrom = formData.get('sabbatical_from') as string | null
    const sabbaticalTo = formData.get('sabbatical_to') as string | null

    const { data: newReq, error: insertError } = await admin
      .from('separation_requests')
      .insert({
        employee_id: user.id,
        type,
        reason,
        sabbatical_from: type === 'sabbatical' ? sabbaticalFrom : null,
        sabbatical_to: type === 'sabbatical' ? sabbaticalTo : null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      redirect(`/leave/separation?error=${encodeURIComponent(insertError.message)}`)
    }

    // Notify all super_admin and sub_super_admin users
    const { data: emp } = await admin.from('users').select('name').eq('id', user.id).single()
    const { data: admins } = await admin
      .from('users')
      .select('id')
      .in('role', ['super_admin', 'sub_super_admin'])
      .eq('is_active', true)

    if (admins && admins.length > 0 && emp) {
      const typeLabel = type === 'resignation' ? 'Resignation' : 'Sabbatical'
      await admin.from('notifications').insert(
        admins.map(a => ({
          recipient_id: a.id,
          type: 'action_needed',
          title: `${typeLabel} Request — ${emp.name}`,
          message: `${emp.name} has submitted a ${typeLabel.toLowerCase()} request. Please review and take action.`,
          related_id: newReq?.id ?? null,
        }))
      )
    }

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

      {errorMsg && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem',
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <SeparationForm
        submitSeparation={submitSeparation}
        withdrawRequest={withdrawRequest}
        existing={existing}
        todayStr={todayIST()}
      />
    </div>
  )
}
