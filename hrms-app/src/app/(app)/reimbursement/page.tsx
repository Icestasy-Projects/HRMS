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

  async function fetchPendingReview() {
    if (!isAdmin) return [] as never[]
    const admin = createAdminClient()
    if (employee!.role === 'admin') {
      const { data: team } = await supabase.from('users').select('id').eq('manager_id', employee!.id)
      const teamIds = team?.map(t => t.id) ?? []
      if (teamIds.length === 0) return []
      const { data } = await admin
        .from('reimbursements')
        .select('*, users!reimbursements_employee_id_fkey(name)')
        .eq('status', 'pending')
        .neq('employee_id', employee!.id)
        .in('employee_id', teamIds)
        .order('created_at', { ascending: false })
      return data ?? []
    }
    const { data } = await admin
      .from('reimbursements')
      .select('*, users!reimbursements_employee_id_fkey(name)')
      .eq('status', 'pending')
      .neq('employee_id', employee!.id)
      .order('created_at', { ascending: false })
    return data ?? []
  }

  async function fetchAllReimbursements() {
    if (!isAdmin) return [] as never[]
    const admin = createAdminClient()
    if (employee!.role === 'admin') {
      const { data: team } = await supabase.from('users').select('id').eq('manager_id', employee!.id)
      const teamIds = team?.map(t => t.id) ?? []
      if (teamIds.length === 0) return []
      const { data } = await admin
        .from('reimbursements')
        .select('*, users!reimbursements_employee_id_fkey(name)')
        .in('employee_id', [...teamIds, employee!.id])
        .order('created_at', { ascending: false })
      return data ?? []
    }
    const { data } = await admin
      .from('reimbursements')
      .select('*, users!reimbursements_employee_id_fkey(name)')
      .order('created_at', { ascending: false })
    return data ?? []
  }

  const [{ data: myReimbursements }, pendingReview, allReimbursements] = await Promise.all([
    supabase
      .from('reimbursements')
      .select('*')
      .eq('employee_id', employee!.id)
      .order('created_at', { ascending: false }),
    fetchPendingReview(),
    fetchAllReimbursements(),
  ])

  function groupIntoBatches(rows: Record<string, unknown>[], includeName: boolean) {
    const map = new Map<string, Record<string, unknown>[]>()
    for (const r of rows) {
      const bid = r.batch_id as string
      const list = map.get(bid) ?? []
      list.push(r)
      map.set(bid, list)
    }
    return Array.from(map.entries()).map(([batchId, items]) => ({
      batchId,
      items: items as { id: string; expense_date: string; category: string; purpose: string; amount: number; status: string; created_at: string }[],
      total: items.reduce((s, i) => s + Number(i.amount as number), 0),
      status: items[0].status as string,
      createdAt: items[0].created_at as string,
      ...(includeName ? {
        employeeName: (items[0].users as { name: string } | null)?.name ?? 'Unknown',
      } : {}),
    }))
  }

  function computeStats(batchList: { total: number; status: string }[]) {
    let totalClaimed = 0, totalApproved = 0, totalPending = 0, totalRejected = 0
    for (const b of batchList) {
      totalClaimed += b.total
      if (b.status === 'approved') totalApproved += b.total
      else if (b.status === 'pending') totalPending += b.total
      else if (b.status === 'rejected') totalRejected += b.total
    }
    return { totalClaimed, totalApproved, totalPending, totalRejected, claimCount: batchList.length }
  }

  const batches = groupIntoBatches(myReimbursements ?? [], false)
  const pendingBatches = groupIntoBatches(pendingReview ?? [], true)
  const allBatches = groupIntoBatches(allReimbursements ?? [], true)

  const myStats = computeStats(batches)
  const allStats = isAdmin ? computeStats(allBatches) : null

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
        allBatches={allBatches}
        isAdmin={isAdmin}
        categoryLabels={CATEGORY_LABELS}
        myStats={myStats}
        allStats={allStats}
        approveAction={approveReimbursement}
        rejectAction={rejectReimbursement}
      />
    </div>
  )
}
