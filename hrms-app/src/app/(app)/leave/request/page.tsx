import Breadcrumb from '@/components/Breadcrumb'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { countWorkdays } from '@/lib/leave'
import LeaveRequestForm from './LeaveRequestForm'

export default async function LeaveRequestPage({
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
    .select('*')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  const admin = createAdminClient()
  const { data: balance } = await admin
    .rpc('get_or_create_leave_balance', { p_employee_id: employee.id })

  // Fetch public holidays for the year
  const year = new Date().getFullYear()
  const { data: holidayRows } = await supabase
    .from('holidays')
    .select('date')
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
  const holidays = holidayRows?.map((h: { date: string }) => h.date) ?? []

  async function submitLeave(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!emp) return

    const leaveType = formData.get('leave_type') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const isHalfDay = formData.get('is_half_day') === 'on'
    const reason = formData.get('reason') as string

    if (isHalfDay && startDate !== endDate) {
      redirect(`/leave/request?error=${encodeURIComponent('Half day leave must have the same start and end date.')}`)
    }

    // Check for existing leave on overlapping dates
    const { data: overlapping } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('employee_id', emp.id)
      .neq('status', 'rejected')
      .lte('start_date', endDate)
      .gte('end_date', startDate)
      .limit(1)

    if (overlapping && overlapping.length > 0) {
      redirect(`/leave/request?error=${encodeURIComponent('You already have a leave request on one or more of these dates.')}`)
    }

    // Count workdays (skip weekends + public holidays)
    const yr = new Date(startDate).getFullYear()
    const { data: hRows } = await supabase
      .from('holidays').select('date')
      .gte('date', `${yr}-01-01`).lte('date', `${yr}-12-31`)
    const hList = hRows?.map((h: { date: string }) => h.date) ?? []

    const isUnscheduled = leaveType === 'UL'
    const workdays = countWorkdays(startDate, endDate, hList)
    const daysCount = isHalfDay ? (isUnscheduled ? 0.75 : 0.5) : workdays

    if (workdays === 0) {
      redirect(`/leave/request?error=${encodeURIComponent('Selected dates fall on weekends or public holidays only.')}`)
    }

    const { data: newRequest, error: insertError } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: emp.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        is_half_day: isHalfDay,
        days_count: daysCount,
        reason,
        status: isUnscheduled ? 'approved' : 'pending',
      })
      .select()
      .single()

    if (insertError || !newRequest) {
      redirect(`/leave/request?error=${encodeURIComponent(insertError?.message ?? 'Failed to submit leave request')}`)
    }

    if (isUnscheduled) {
      const { data: bal } = await supabase.from('leave_balances').select('*').eq('user_id', emp.id).single()
      if (bal) {
        await supabase.from('leave_balances')
          .update({ ul_used: bal.ul_used + daysCount })
          .eq('user_id', emp.id)
      }
      if (emp.department_id) {
        const { data: dept } = await supabase.from('departments').select('manager_id').eq('id', emp.department_id).single()
        if (dept?.manager_id && dept.manager_id !== emp.id) {
          await supabase.from('notifications').insert({
            recipient_id: dept.manager_id, type: 'fyi', title: 'Unscheduled Leave Taken',
            message: `${emp.name} has taken ${daysCount} day(s) of unscheduled leave from ${startDate} to ${endDate}.`,
            related_id: newRequest.id,
          })
        }
      }
    } else {
      if (emp.department_id) {
        const { data: dept } = await supabase.from('departments').select('manager_id').eq('id', emp.department_id).single()
        if (dept?.manager_id && dept.manager_id !== emp.id) {
          await supabase.from('notifications').insert({
            recipient_id: dept.manager_id, type: 'action_needed', title: 'Leave Request Pending Approval',
            message: `${emp.name} has requested ${daysCount} day(s) of scheduled leave from ${startDate} to ${endDate}.`,
            related_id: newRequest.id,
          })
        }
      }
    }

    redirect('/leave/history')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Leave', href: '/leave' }, { label: 'Request' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Request Leave
        </h1>
      </div>

      {errorMsg && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
        <LeaveRequestForm
          scheduledBalance={balance?.sl_remaining ?? 0}
          unscheduledBalance={balance?.ul_remaining ?? 0}
          holidays={holidays}
          onSubmit={submitLeave}
        />
      </div>
    </div>
  )
}
