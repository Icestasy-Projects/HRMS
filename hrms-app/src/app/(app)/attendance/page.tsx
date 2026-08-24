import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { formatTime, HALF_DAY_LATE_CUTOFF, HALF_DAY_EARLY_CUTOFF, SCHEDULE, computeAttendanceStatus, todayIST, timeIST, nowIST, OFFICE_LOCATION, GEOFENCE_RADIUS_M, haversineDistance } from '@/lib/attendance'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import ClockButton from '@/components/ClockButton'

function workingDaysElapsed(year: number, month: number, scheduleType: 'white_collar' | 'blue_collar'): number {
  const maxDow = scheduleType === 'white_collar' ? 5 : 6
  const today = new Date()
  const lastDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate() : new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow >= 1 && dow <= maxDow) count++
  }
  return count
}

function workingDaysInMonth(year: number, month: number, scheduleType: 'white_collar' | 'blue_collar'): number {
  const maxDow = scheduleType === 'white_collar' ? 5 : 6
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow >= 1 && dow <= maxDow) count++
  }
  return count
}

export default async function AttendancePage({
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

  const today = todayIST()

  const { data: todayLog } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', employee.id)
    .eq('work_date', today)
    .single()

  const isClockedIn = todayLog && !todayLog.check_out
  const isDone = todayLog && todayLog.check_out

  const scheduleType = employee.employee_type === 'blue_collar' ? 'blue_collar' : 'white_collar'
  const schedule = SCHEDULE[scheduleType]

  let hoursWorked: string | null = null
  if (todayLog?.check_in) {
    const inTime = new Date(`${today}T${todayLog.check_in}`)
    const outTime = todayLog.check_out ? new Date(`${today}T${todayLog.check_out}`) : nowIST()
    const diffMins = Math.max(0, Math.floor((outTime.getTime() - inTime.getTime()) / 60000))
    const h = Math.floor(diffMins / 60)
    const m = diffMins % 60
    hoursWorked = m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  // Monthly hours
  const nowDate = new Date()
  const curYear = nowDate.getFullYear()
  const curMonth = nowDate.getMonth() + 1
  const monthStart = `${curYear}-${String(curMonth).padStart(2, '0')}-01`
  const monthEnd = `${curYear}-${String(curMonth).padStart(2, '0')}-31`
  const schedType: 'white_collar' | 'blue_collar' = scheduleType as 'white_collar' | 'blue_collar'
  const { data: monthLogs } = await supabase
    .from('attendance_logs')
    .select('check_in, check_out, work_date')
    .eq('user_id', employee.id)
    .gte('work_date', monthStart)
    .lte('work_date', monthEnd)
    .not('check_out', 'is', null)

  let monthWorkedMins = 0
  for (const log of monthLogs ?? []) {
    if (!log.check_in || !log.check_out) continue
    const inMs = new Date(`${log.work_date}T${log.check_in}`).getTime()
    const outMs = new Date(`${log.work_date}T${log.check_out}`).getTime()
    monthWorkedMins += Math.max(0, Math.floor((outMs - inMs) / 60000))
  }
  const monthWorkedH = Math.floor(monthWorkedMins / 60)
  const monthWorkedM = monthWorkedMins % 60
  const monthWorkedStr = monthWorkedM === 0 ? `${monthWorkedH}h` : `${monthWorkedH}h ${monthWorkedM}m`

  const elapsedDays = workingDaysElapsed(curYear, curMonth, schedType)
  const totalDays = workingDaysInMonth(curYear, curMonth, schedType)
  const elapsedQuotaH = elapsedDays * schedule.hours_per_day
  const monthlyQuotaH = totalDays * schedule.hours_per_day
  const monthWorkedHDecimal = monthWorkedMins / 60
  const deficitH = Math.max(0, Math.round((elapsedQuotaH - monthWorkedHDecimal) * 10) / 10)
  const monthPct = elapsedQuotaH > 0 ? Math.min(100, Math.round((monthWorkedHDecimal / elapsedQuotaH) * 100)) : 100

  async function deductHalfDayLeave(employeeId: string, date: string) {
    'use server'
    const admin = createAdminClient()
    const year = date.slice(0, 4)

    // Skip super admins — attendance not tracked for them
    const { data: emp } = await admin.from('users').select('role').eq('id', employeeId).single()
    if (emp?.role === 'super_admin') return

    // Skip if employee is on approved sabbatical covering this date
    const { data: sabbatical } = await admin
      .from('separation_requests')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('type', 'sabbatical')
      .eq('status', 'approved')
      .lte('sabbatical_from', date)
      .gte('sabbatical_to', date)
      .maybeSingle()
    if (sabbatical) return

    // Skip if any approved leave already exists for this date (prevents double-deduction)
    const { data: existing } = await admin
      .from('leave_requests')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date)
      .maybeSingle()
    if (existing) return

    // Calculate remaining balances
    const { data: bal } = await admin
      .from('leave_balances')
      .select('ul_total, sl_total')
      .eq('user_id', employeeId)
      .eq('year', Number(year))
      .maybeSingle()

    const { data: usedLeaves } = await admin
      .from('leave_requests')
      .select('leave_type, days_count')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .gte('start_date', `${year}-01-01`)

    const ulUsed = usedLeaves?.filter(r => r.leave_type === 'UL').reduce((s, r) => s + Number(r.days_count), 0) ?? 0
    const slUsed = usedLeaves?.filter(r => r.leave_type === 'SL').reduce((s, r) => s + Number(r.days_count), 0) ?? 0
    const ulRemaining = Math.max(0, (bal?.ul_total ?? 6) - ulUsed)
    const slRemaining = Math.max(0, (bal?.sl_total ?? 18) - slUsed)

    const deduct = 0.5
    const ulDeduct = Math.min(deduct, ulRemaining)
    const slDeduct = Math.min(deduct - ulDeduct, slRemaining)
    // any remainder beyond sl goes to salary deduction (noted in reason)
    const salaryDeduct = deduct - ulDeduct - slDeduct

    if (ulDeduct > 0) {
      await admin.from('leave_requests').insert({
        employee_id: employeeId, leave_type: 'UL',
        start_date: date, end_date: date,
        is_half_day: true, days_count: ulDeduct,
        reason: 'Auto: unscheduled half day (attendance)',
        status: 'approved',
      })
    }
    if (slDeduct > 0) {
      await admin.from('leave_requests').insert({
        employee_id: employeeId, leave_type: 'SL',
        start_date: date, end_date: date,
        is_half_day: true, days_count: slDeduct,
        reason: 'Auto: unscheduled half day (UL exhausted)',
        status: 'approved',
      })
    }
    // salaryDeduct > 0 means both UL and SL are exhausted — to be handled in payroll
  }

  async function clockInOut(lat: number, lng: number) {
    'use server'
    const distance = haversineDistance(lat, lng, OFFICE_LOCATION.lat, OFFICE_LOCATION.lng)
    if (distance > GEOFENCE_RADIUS_M) {
      const distKm = (distance / 1000).toFixed(1)
      redirect(`/attendance?error=${encodeURIComponent(`You are ${distKm} km from the office. Clock in/out is only allowed within ${GEOFENCE_RADIUS_M}m of the office.`)}`)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const admin = createAdminClient()

    const { data: emp } = await admin.from('users').select('*').eq('id', user.id).single()
    if (!emp) return

    const today = todayIST()
    const timeStr = timeIST()

    // Determine if today is a weekend for this employee's schedule
    const dow = new Date(today + 'T00:00:00').getDay() // 0=Sun,6=Sat
    const schedType = emp.employee_type === 'blue_collar' ? 'blue_collar' : 'white_collar'
    // white_collar: Sat(6)+Sun(0) are off; blue_collar: only Sun(0) is off
    const isWeekendDay = schedType === 'white_collar' ? (dow === 0 || dow === 6) : dow === 0

    const { data: existing } = await admin
      .from('attendance_logs')
      .select('*')
      .eq('user_id', emp.id)
      .eq('work_date', today)
      .single()

    if (isWeekendDay) {
      // Weekend: log hours only — try weekend_work status, fall back to present
      if (!existing) {
        let res = await admin.from('attendance_logs').insert({
          user_id: emp.id, work_date: today, check_in: timeStr, day_status: 'weekend_work',
        })
        if (res.error) {
          res = await admin.from('attendance_logs').insert({
            user_id: emp.id, work_date: today, check_in: timeStr, day_status: 'present',
          })
        }
        if (res.error) redirect(`/attendance?error=${encodeURIComponent(res.error.message)}`)
      } else if (!existing.check_out) {
        const { error } = await admin
          .from('attendance_logs')
          .update({ check_out: timeStr })
          .eq('id', existing.id)
        if (error) redirect(`/attendance?error=${encodeURIComponent(error.message)}`)
      }
      redirect('/attendance')
    }

    // Weekday: normal half-day logic
    const { data: scheduledLeave } = await admin
      .from('leave_requests')
      .select('id')
      .eq('employee_id', emp.id)
      .eq('status', 'approved')
      .eq('is_half_day', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle()
    const hasScheduledHalfDay = !!scheduledLeave

    if (!existing) {
      const { dayStatus } = computeAttendanceStatus(timeStr, null, hasScheduledHalfDay)
      const { error } = await admin.from('attendance_logs').insert({
        user_id: emp.id,
        work_date: today,
        check_in: timeStr,
        day_status: dayStatus,
      })
      if (error) redirect(`/attendance?error=${encodeURIComponent(error.message)}`)
      if (dayStatus === 'unscheduled_half_day_first_off') {
        await deductHalfDayLeave(emp.id, today)
      }
    } else if (!existing.check_out) {
      const { dayStatus } = computeAttendanceStatus(existing.check_in, timeStr, hasScheduledHalfDay)
      const { error } = await admin
        .from('attendance_logs')
        .update({ check_out: timeStr, day_status: dayStatus })
        .eq('id', existing.id)
      if (error) redirect(`/attendance?error=${encodeURIComponent(error.message)}`)
      if (dayStatus === 'unscheduled_half_day_second_off') {
        await deductHalfDayLeave(emp.id, today)
      }
    }

    redirect('/attendance')
  }

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const isHalfDay = todayLog?.day_status?.includes('half_day')
  const statusLabel = isDone ? (isHalfDay ? 'Half Day' : 'Day Complete') : isClockedIn ? 'Clocked In' : 'Not Clocked In'
  const statusColor = isDone ? 'var(--success)' : isClockedIn ? 'var(--primary)' : 'var(--muted)'
  const statusBg = isDone ? 'var(--success-l)' : isClockedIn ? 'var(--primary-l)' : 'var(--surface2)'

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Attendance' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Time &amp; Attendance
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{todayFormatted}</p>
      </div>

      {errorMsg && (
        <div style={{
          background: 'var(--danger-l)', border: '1px solid var(--danger)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem',
          color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          ⚠️ {errorMsg}
          <p style={{ margin: '0.375rem 0 0', fontSize: '0.8rem', opacity: 0.85 }}>
            If this persists, ask your admin to disable Row Level Security on attendance_logs in Supabase.
          </p>
        </div>
      )}

      {/* Status + times hero card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1rem', padding: '1.75rem 1.5rem',
        marginBottom: '1rem', boxShadow: 'var(--shadow)',
        textAlign: 'center',
      }}>
        <span style={{
          display: 'inline-block',
          background: statusBg, color: statusColor,
          border: `1px solid ${statusColor}`,
          borderRadius: '999px', padding: '0.25rem 0.875rem',
          fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.25rem',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{statusLabel}</span>

        {todayLog ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>In</p>
              <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{formatTime(todayLog.check_in)}</p>
            </div>
            {todayLog.check_out ? (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>Out</p>
                <p style={{ color: 'var(--success)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{formatTime(todayLog.check_out)}</p>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>Duration</p>
                <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{hoursWorked ?? '--'}</p>
              </div>
            )}
            {todayLog.check_out && hoursWorked && (
              <div>
                <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem' }}>Hours</p>
                <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '2rem', margin: 0, lineHeight: 1 }}>{hoursWorked}</p>
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: '0 0 1rem' }}>You haven&apos;t clocked in yet today.</p>
        )}

        {isHalfDay && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            background: 'var(--warning-l)', border: '1px solid var(--warning)',
            borderRadius: '999px', padding: '0.25rem 0.875rem',
            color: 'var(--warning)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '1rem',
          }}>
            ⚠️ Half Day
          </div>
        )}
      </div>

      {/* Clock button */}
      <div style={{ marginBottom: '1rem' }}>
        <ClockButton isDone={!!isDone} isClockedIn={!!isClockedIn} action={clockInOut} />
      </div>

      {/* Quick link to history */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <Link href="/attendance/history" style={{
          color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500,
        }}>
          View attendance history →
        </Link>
      </div>

      {/* Monthly hours widget */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.875rem', padding: '1.125rem 1.25rem',
        boxShadow: 'var(--shadow)', marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            This Month&apos;s Hours
          </p>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700,
            color: monthPct >= 90 ? 'var(--success)' : monthPct >= 70 ? 'var(--warning)' : 'var(--danger)',
          }}>
            {monthPct}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.625rem' }}>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>{monthWorkedStr}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>worked of {elapsedQuotaH}h elapsed · {monthlyQuotaH}h total</p>
          </div>
          {deficitH > 0 && (
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)', margin: 0 }}>
              -{deficitH}h behind
            </p>
          )}
        </div>
        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{
            width: `${monthPct}%`, height: '100%', borderRadius: '999px',
            background: monthPct >= 90 ? 'var(--success)' : monthPct >= 70 ? 'var(--warning)' : 'var(--danger)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Rules card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.25rem', boxShadow: 'var(--shadow)',
      }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.875rem' }}>
          Half-Day Rules
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--warning-l)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem',
          }}>
            <span style={{ fontSize: '1rem' }}>🕐</span>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
              Arrive after <strong>{HALF_DAY_LATE_CUTOFF}</strong> = half day
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--warning-l)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem',
          }}>
            <span style={{ fontSize: '1rem' }}>🕒</span>
            <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: 0 }}>
              Leave before <strong>{HALF_DAY_EARLY_CUTOFF}</strong> = half day
            </p>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.375rem 0 0' }}>
            Schedule: {schedule.days.join(', ')} · {schedule.hours_per_day}h/day ({scheduleType.replace('_', ' ')})
          </p>
        </div>
      </div>
    </div>
  )
}
