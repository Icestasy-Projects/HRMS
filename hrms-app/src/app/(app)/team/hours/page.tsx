import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import { SCHEDULE, todayIST } from '@/lib/attendance'

export const dynamic = 'force-dynamic'

function workingDaysInMonth(year: number, month: number, scheduleType: 'white_collar' | 'blue_collar'): number {
  // white_collar: Mon-Fri (1-5); blue_collar: Mon-Sat (1-6)
  const maxDow = scheduleType === 'white_collar' ? 5 : 6
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay() // 0=Sun
    if (dow >= 1 && dow <= maxDow) count++
  }
  return count
}

function workingDaysElapsed(year: number, month: number, scheduleType: 'white_collar' | 'blue_collar'): number {
  const maxDow = scheduleType === 'white_collar' ? 5 : 6
  const today = new Date()
  const lastDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate()
    : new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow >= 1 && dow <= maxDow) count++
  }
  return count
}

export default async function TeamHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()
  const now = new Date()
  const year = now.getFullYear()
  const selectedMonth = params.month ? Number(params.month) : now.getMonth() + 1

  const monthStart = `${year}-${String(selectedMonth).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(selectedMonth).padStart(2, '0')}-31`

  const { data: employees } = await admin
    .from('users')
    .select('id, name, employee_type, departments(name)')
    .eq('is_active', true)
    .order('name')

  const { data: logs } = await admin
    .from('attendance_logs')
    .select('user_id, check_in, check_out, work_date')
    .gte('work_date', monthStart)
    .lte('work_date', monthEnd)
    .not('check_out', 'is', null)

  // Build hours map per user
  const hoursMap: Record<string, number> = {}
  for (const log of logs ?? []) {
    if (!log.check_in || !log.check_out) continue
    const inMs = new Date(`${log.work_date}T${log.check_in}`).getTime()
    const outMs = new Date(`${log.work_date}T${log.check_out}`).getTime()
    const hrs = Math.max(0, (outMs - inMs) / 3600000)
    hoursMap[log.user_id] = (hoursMap[log.user_id] ?? 0) + hrs
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const rows = (employees ?? []).map(emp => {
    const schedType: 'white_collar' | 'blue_collar' =
      emp.employee_type === 'blue_collar' ? 'blue_collar' : 'white_collar'
    const schedule = SCHEDULE[schedType]
    const totalDays = workingDaysInMonth(year, selectedMonth, schedType)
    const elapsedDays = workingDaysElapsed(year, selectedMonth, schedType)
    const monthlyQuota = totalDays * schedule.hours_per_day
    const elapsedQuota = elapsedDays * schedule.hours_per_day
    const workedHours = Math.round((hoursMap[emp.id] ?? 0) * 10) / 10
    const deficit = Math.max(0, Math.round((elapsedQuota - workedHours) * 10) / 10)
    const pct = elapsedQuota > 0 ? Math.min(100, Math.round((workedHours / elapsedQuota) * 100)) : 100
    const dept = (emp.departments as unknown as { name: string } | null)?.name ?? '—'
    return { id: emp.id, name: emp.name, dept, workedHours, monthlyQuota, elapsedQuota, deficit, pct }
  })

  const th: React.CSSProperties = {
    padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    whiteSpace: 'nowrap', borderBottom: '2px solid var(--border)', background: 'var(--surface2)',
  }
  const td: React.CSSProperties = {
    padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text)',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Hours Tracker' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Hours Tracker
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {MONTHS[selectedMonth - 1]} {year} — hours worked vs monthly quota
        </p>
      </div>

      {/* Month filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {MONTHS.map((m, i) => (
          <a key={m} href={`/team/hours?month=${i + 1}`} style={{
            padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
            background: selectedMonth === i + 1 ? 'var(--primary)' : 'var(--surface)',
            color: selectedMonth === i + 1 ? '#fff' : 'var(--muted)',
            border: `1px solid ${selectedMonth === i + 1 ? 'var(--primary)' : 'var(--border)'}`,
            textDecoration: 'none',
          }}>{m}</a>
        ))}
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Employees', value: rows.length },
          { label: 'On Track (≥90%)', value: rows.filter(r => r.pct >= 90).length },
          { label: 'Behind (<90%)', value: rows.filter(r => r.pct < 90).length },
        ].map(chip => (
          <div key={chip.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '0.625rem 1rem',
            display: 'flex', flexDirection: 'column', minWidth: '120px',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{chip.label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{chip.value}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Employee</th>
                <th style={th}>Department</th>
                <th style={{ ...th, textAlign: 'right' }}>Hours Worked</th>
                <th style={{ ...th, textAlign: 'right' }}>Elapsed Quota</th>
                <th style={{ ...th, textAlign: 'right' }}>Monthly Quota</th>
                <th style={{ ...th, textAlign: 'right' }}>Deficit</th>
                <th style={{ ...th, textAlign: 'center' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const behind = row.pct < 90
                const rowBg = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'
                const barColor = row.pct >= 90 ? 'var(--success)' : row.pct >= 70 ? 'var(--warning)' : 'var(--danger)'
                return (
                  <tr key={row.id} style={{ background: rowBg }}>
                    <td style={{ ...td, fontWeight: 600 }}>{row.name}</td>
                    <td style={{ ...td, color: 'var(--muted)' }}>{row.dept}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{row.workedHours}h</td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--muted)' }}>{row.elapsedQuota}h</td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--muted)' }}>{row.monthlyQuota}h</td>
                    <td style={{
                      ...td, textAlign: 'right', fontWeight: 700,
                      color: behind && row.deficit > 0 ? 'var(--danger)' : 'var(--muted)',
                    }}>
                      {row.deficit > 0 ? `-${row.deficit}h` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'center', minWidth: '140px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${row.pct}%`, height: '100%', background: barColor, borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: barColor, minWidth: '34px' }}>{row.pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.75rem', textAlign: 'right' }}>
        Progress = hours worked / hours elapsed so far this month · Deficit = hours behind elapsed quota
      </p>
    </div>
  )
}
