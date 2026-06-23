import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaveRequestForm from './LeaveRequestForm'

export default async function LeaveRequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!employee) redirect('/login')

  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .single()

  async function submitLeave(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: emp } = await supabase.from('users').select('*').eq('email', user.email).single()
    if (!emp) return

    const leaveType = formData.get('leave_type') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const isHalfDay = formData.get('is_half_day') === 'on'
    const reason = formData.get('reason') as string

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    const daysCount = isHalfDay ? 0.5 : diffDays

    const isUnscheduled = leaveType === 'unscheduled'

    const { data: newRequest } = await supabase
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

    if (isUnscheduled && newRequest) {
      // Deduct balance
      const { data: bal } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', emp.id)
        .single()

      if (bal) {
        await supabase
          .from('leave_balances')
          .update({ unscheduled_balance: bal.unscheduled_balance - daysCount })
          .eq('employee_id', emp.id)
      }

      // Notify manager (FYI)
      if (emp.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('manager_id')
          .eq('id', emp.department_id)
          .single()

        if (dept?.manager_id && dept.manager_id !== emp.id) {
          await supabase.from('notifications').insert({
            recipient_id: dept.manager_id,
            type: 'fyi',
            title: 'Unscheduled Leave Taken',
            message: `${emp.name} has taken ${daysCount} day(s) of unscheduled leave from ${startDate} to ${endDate}.`,
            related_id: newRequest.id,
          })
        }
      }
    } else if (!isUnscheduled && newRequest) {
      // Notify manager for approval
      if (emp.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('manager_id')
          .eq('id', emp.department_id)
          .single()

        if (dept?.manager_id && dept.manager_id !== emp.id) {
          await supabase.from('notifications').insert({
            recipient_id: dept.manager_id,
            type: 'action_needed',
            title: 'Leave Request Pending Approval',
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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Request Leave
      </h1>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
      >
        <LeaveRequestForm
          scheduledBalance={balance?.scheduled_balance ?? 0}
          unscheduledBalance={balance?.unscheduled_balance ?? 0}
          onSubmit={submitLeave}
        />
      </div>
    </div>
  )
}
