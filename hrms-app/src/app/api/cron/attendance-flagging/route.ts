import { createAdminClient } from '@/lib/supabase/admin'
import { todayIST, timeIST } from '@/lib/attendance'
import { NextResponse } from 'next/server'

// Runs at 4:30 PM IST (11:00 UTC) via Vercel cron
// Flags employees who never clocked in today
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = todayIST()

  // Get all active non-super-admin employees
  const { data: employees } = await supabase
    .from('users')
    .select('id')
    .eq('is_active', true)
    .not('role', 'in', '("super_admin","sub_super_admin")')

  if (!employees?.length) return NextResponse.json({ flagged: 0 })

  // Get employees who already have a log today
  const { data: existingLogs } = await supabase
    .from('attendance_logs')
    .select('user_id')
    .eq('work_date', today)

  const loggedIds = new Set(existingLogs?.map(l => l.user_id) ?? [])
  const absentIds = employees.map(e => e.id).filter(id => !loggedIds.has(id))

  if (!absentIds.length) return NextResponse.json({ flagged: 0 })

  let flagged = 0

  for (const userId of absentIds) {
    // Check for approved scheduled half-day leave covering today
    const { data: scheduledLeave } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('employee_id', userId)
      .eq('status', 'approved')
      .eq('is_half_day', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle()

    // Check for approved full-day leave (no need to flag absent separately)
    const { data: fullLeave } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('employee_id', userId)
      .eq('status', 'approved')
      .eq('is_half_day', false)
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle()

    if (fullLeave) continue // Full day leave approved — skip

    if (scheduledLeave) {
      // Had approved half-day leave but didn't show for the other half
      // Flag as scheduled_half_day_first_off + deduct 0.5 unscheduled from UL balance
      await supabase.from('attendance_logs').insert({
        user_id: userId,
        work_date: today,
        day_status: 'scheduled_half_day_first_off',
        notes: 'Auto-flagged: scheduled half-day leave used; second half absent (unscheduled)',
      })
      // Deduct 0.5 day from ul_remaining
      await supabase.rpc('deduct_ul_half_day', { p_user_id: userId })
    } else {
      // No leave at all — full unscheduled absence
      await supabase.from('attendance_logs').insert({
        user_id: userId,
        work_date: today,
        day_status: 'unscheduled_leave_full_day',
        notes: 'Auto-flagged: no clock-in by 4:30 PM IST',
      })
      // Deduct 1 day from ul_remaining
      await supabase.rpc('deduct_ul_full_day', { p_user_id: userId })
    }

    flagged++
  }

  return NextResponse.json({ flagged, date: today })
}
