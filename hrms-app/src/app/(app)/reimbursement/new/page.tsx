import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReimbursementForm from './ReimbursementForm'

export default async function NewReimbursementPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMsg = params?.error

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  async function submitReimbursement(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('users').select('id').eq('id', user.id).single()
    if (!emp) return

    const entriesJson = formData.get('entries_json') as string
    let entries: { date: string; category: string; purpose: string; amount: string }[]
    try {
      entries = JSON.parse(entriesJson)
    } catch {
      redirect(`/reimbursement/new?error=${encodeURIComponent('Invalid form data.')}`)
    }

    if (!entries || entries.length === 0) {
      redirect(`/reimbursement/new?error=${encodeURIComponent('Please add at least one entry.')}`)
    }

    for (const e of entries) {
      if (!e.date || !e.category || !e.purpose?.trim() || !parseFloat(e.amount)) {
        redirect(`/reimbursement/new?error=${encodeURIComponent('All fields are required for each entry.')}`)
      }
    }

    const batchId = crypto.randomUUID()
    const rows = entries.map(e => ({
      employee_id: emp.id,
      batch_id: batchId,
      expense_date: e.date,
      category: e.category,
      purpose: e.purpose.trim(),
      amount: parseFloat(e.amount),
      status: 'pending' as const,
    }))

    const { error: insertError } = await supabase.from('reimbursements').insert(rows)

    if (insertError) {
      redirect(`/reimbursement/new?error=${encodeURIComponent(insertError.message)}`)
    }

    redirect('/reimbursement')
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Reimbursement', href: '/reimbursement' },
          { label: 'New Claim' },
        ]} />
        <h1 style={{
          fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)',
          margin: 0, letterSpacing: '-0.02em',
        }}>
          New Reimbursement
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Add one or more expense entries below
        </p>
      </div>

      {errorMsg && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.5rem',
        boxShadow: 'var(--shadow)',
      }}>
        <ReimbursementForm onSubmit={submitReimbursement} />
      </div>
    </div>
  )
}
