import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaveRequestForm from './LeaveRequestForm'

export default async function LeaveRequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!employee) redirect('/login')

  const year = new Date().getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('year', year)
    .single()

  async function submitLeaveRequest(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', user.email)
      .single()
    if (!employee) return

    const leaveType = formData.get('leave_type') as string
    const startDate = formData.get('start_date') as string
    const endDate = formData.get('end_date') as string
    const isHalfDay = formData.get('is_half_day') === 'true'
    const reason = formData.get('reason') as string

    if (!leaveType || !startDate || !endDate) return

    // Calculate working days
    const start = new Date(startDate)
    const end = new Date(endDate)
    let days = 0
    const current = new Date(start)
    while (current <= end) {
      const dow = current.getDay()
      if (dow !== 0 && dow !== 6) days++
      current.setDate(current.getDate() + 1)
    }
    if (isHalfDay) days = 0.5

    const deduction = isHalfDay
      ? (leaveType === 'scheduled' ? 0.5 : 0.75)
      : days

    const isUnscheduled = leaveType === 'unscheduled'
    const status = isUnscheduled ? 'approved' : 'pending'

    const { error } = await supabase.from('leave_requests').insert({
      employee_id: employee.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      is_half_day: isHalfDay,
      status,
      reason,
      days_requested: days,
      days_deducted: isUnscheduled ? deduction : null,
    })

    if (error) return

    // Deduct immediately for unscheduled leave
    if (isUnscheduled) {
      const year = new Date().getFullYear()
      const { data: bal } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('year', year)
        .single()

      if (bal) {
        await supabase
          .from('leave_balances')
          .update({
            unscheduled_used: bal.unscheduled_used + deduction,
            unscheduled_balance: Math.max(0, bal.unscheduled_balance - deduction),
          })
          .eq('id', bal.id)
      }

      // FYI notification to manager
      if (employee.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('manager_id')
          .eq('id', employee.department_id)
          .single()

        if (dept?.manager_id) {
          const { data: mgr } = await supabase
            .from('employees')
            .select('id')
            .eq('id', dept.manager_id)
            .single()

          if (mgr) {
            await supabase.from('notifications').insert({
              recipient_id: mgr.id,
              sender_id: employee.id,
              message: `${employee.full_name} has taken unscheduled leave from ${startDate} to ${endDate}. No action needed.`,
              requires_action: false,
              is_read: false,
            })
          }
        }
      }
    }

    redirect('/leave')
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Request Leave</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the details below to request time off.
        </p>
      </div>

      <LeaveRequestForm
        balance={balance}
        submitAction={submitLeaveRequest}
      />
    </div>
  )
}
