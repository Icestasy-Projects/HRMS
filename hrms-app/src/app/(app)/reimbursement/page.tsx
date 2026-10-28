import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ReimbursementList from './ReimbursementList'

const CATEGORY_LABELS: Record<string, string> = {
  travel: 'Travel',
  meals: 'Meals',
  accommodation: 'Accommodation',
  office_supplies: 'Office Supplies',
  communication: 'Communication',
  training: 'Training',
  medical: 'Medical',
  other: 'Other',
}

export default async function ReimbursementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  const isAdmin = ['super_admin', 'sub_super_admin', 'admin'].includes(employee.role)

  // Fetch own reimbursements
  const { data: myReimbursements } = await supabase
    .from('reimbursements')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  // For admins, fetch team/all pending reimbursements
  let pendingReview: typeof myReimbursements = []
  if (isAdmin) {
    const admin = createAdminClient()
    let query = admin
      .from('reimbursements')
      .select('*, users!reimbursements_employee_id_fkey(name)')
      .eq('status', 'pending')
      .neq('employee_id', employee.id)
      .order('created_at', { ascending: false })

    if (employee.role === 'admin') {
      const { data: team } = await supabase.from('users').select('id').eq('manager_id', employee.id)
      const teamIds = team?.map(t => t.id) ?? []
      if (teamIds.length > 0) {
        query = query.in('employee_id', teamIds)
      } else {
        query = query.eq('employee_id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const { data } = await query
    pendingReview = data ?? []
  }

  // Group own reimbursements by batch_id
  const batchMap = new Map<string, typeof myReimbursements>()
  for (const r of myReimbursements ?? []) {
    const list = batchMap.get(r.batch_id) ?? []
    list.push(r)
    batchMap.set(r.batch_id, list)
  }
  const batches = Array.from(batchMap.entries()).map(([batchId, items]) => ({
    batchId,
    items: items!,
    total: items!.reduce((s, i) => s + Number(i.amount), 0),
    status: items![0].status,
    createdAt: items![0].created_at,
  }))

  // Group pending review by batch_id
  const pendingBatchMap = new Map<string, typeof pendingReview>()
  for (const r of pendingReview ?? []) {
    const list = pendingBatchMap.get(r.batch_id) ?? []
    list.push(r)
    pendingBatchMap.set(r.batch_id, list)
  }
  const pendingBatches = Array.from(pendingBatchMap.entries()).map(([batchId, items]) => ({
    batchId,
    items: items!,
    total: items!.reduce((s, i) => s + Number(i.amount), 0),
    employeeName: (items![0] as Record<string, unknown>).users
      ? ((items![0] as Record<string, unknown>).users as { name: string }).name
      : 'Unknown',
    createdAt: items![0].created_at,
  }))

  // Server actions for approve/reject
  async function approveReimbursement(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin', 'admin'].includes(me.role)) return

    const batchId = formData.get('batch_id') as string
    const admin = createAdminClient()
    await admin
      .from('reimbursements')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('batch_id', batchId)
      .eq('status', 'pending')

    redirect('/reimbursement')
  }

  async function rejectReimbursement(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin', 'admin'].includes(me.role)) return

    const batchId = formData.get('batch_id') as string
    const admin = createAdminClient()
    await admin
      .from('reimbursements')
      .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('batch_id', batchId)
      .eq('status', 'pending')

    redirect('/reimbursement')
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reimbursement' }]} />
        <h1 style={{
          fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)',
          margin: 0, letterSpacing: '-0.02em',
        }}>
          Reimbursement
        </h1>
      </div>

      {/* New Claim Button */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Link href="/reimbursement/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          background: 'var(--primary)', color: '#fff',
          borderRadius: '0.5rem', padding: '0.75rem 1.5rem',
          fontWeight: 600, fontSize: '0.9rem', minHeight: '44px',
          textDecoration: 'none', boxShadow: 'var(--shadow)',
        }}>
          + New Reimbursement
        </Link>
      </div>

      <ReimbursementList
        batches={batches}
        pendingBatches={pendingBatches}
        isAdmin={isAdmin}
        categoryLabels={CATEGORY_LABELS}
        approveAction={approveReimbursement}
        rejectAction={rejectReimbursement}
      />
    </div>
  )
}
