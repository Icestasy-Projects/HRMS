import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function EmployeeHoursPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { userId } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: employee } = await admin
    .from('users')
    .select('id, name, employee_type, departments(name)')
    .eq('id', userId)
    .single()

  if (!employee) redirect('/team/hours')

  const now = new Date()
  const year = now.getFullYear()
  const selectedMonth = sp.month ? Number(sp.month) : now.getMonth() + 1
  const monthStart = `${year}-${String(selectedMonth).padStart(2, '0')}-01`
  const lastDay = new Date(year, selectedMonth, 0).getDate()
  const monthEnd = `${year}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const { data: logs } = await admin
    .from('attendance_logs')
    .select('work_date, check_in, check_out, hours_worked, day_status, notes')
    .eq('user_id', userId)
    .gte('work_date', monthStart)
    .lte('work_date', monthEnd)
    .order('work_date', { ascending: false })

  const dept = (employee.departments as unknown as { name: string } | null)?.name ?? '—'

  let totalHours = 0
  for (const log of logs ?? []) {
    if (log.hours_worked) totalHours += Number(log.hours_worked)
  }
  totalHours = Math.round(totalHours * 10) / 10

  const daysPresent = (logs ?? []).filter(l => l.check_in).length
  const daysWithCheckout = (logs ?? []).filter(l => l.check_in && l.check_out).length

  const th: React.CSSProperties = {
    padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700,
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    whiteSpace: 'nowrap', borderBottom: '2px solid var(--border)', background: 'var(--surface2)',
  }
  const td: React.CSSProperties = {
    padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text)',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  }

  function statusBadge(status: string) {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      present: { bg: 'rgba(34,197,94,0.12)', color: 'var(--success)', label: 'Present' },
      absent: { bg: 'rgba(239,68,68,0.12)', color: 'var(--danger)', label: 'Absent' },
      unscheduled_half_day_first_off: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', label: 'Late Start' },
      unscheduled_half_day_early_out: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', label: 'Early Out' },
      scheduled_half_day_first_off: { bg: 'rgba(59,130,246,0.12)', color: 'var(--info, #3b82f6)', label: 'Half Day (AM Off)' },
      scheduled_half_day_second_off: { bg: 'rgba(59,130,246,0.12)', color: 'var(--info, #3b82f6)', label: 'Half Day (PM Off)' },
      weekly_off: { bg: 'rgba(107,114,128,0.1)', color: 'var(--muted)', label: 'Weekly Off' },
      holiday: { bg: 'rgba(107,114,128,0.1)', color: 'var(--muted)', label: 'Holiday' },
    }
    const s = map[status] ?? { bg: 'rgba(107,114,128,0.1)', color: 'var(--muted)', label: status.replace(/_/g, ' ') }
    return s
  }

  function formatTime(t: string | null) {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hr = Number(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const hr12 = hr % 12 || 12
    return `${hr12}:${m} ${ampm}`
  }

  function formatDate(d: string) {
    const dt = new Date(d + 'T00:00:00')
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    return `${days[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]}`
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Team', href: '/team' },
          { label: 'Hours Tracker', href: `/team/hours?month=${selectedMonth}` },
          { label: employee.name },
        ]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          {employee.name}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {dept} · Attendance logs for {MONTHS[selectedMonth - 1]} {year}
        </p>
      </div>

      {/* Month filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {MONTHS.map((m, i) => (
          <a key={m} href={`/team/hours/${userId}?month=${i + 1}`} style={{
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
          { label: 'Total Hours', value: `${totalHours}h` },
          { label: 'Days Present', value: daysPresent },
          { label: 'Complete Days', value: daysWithCheckout },
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
                <th style={th}>Date</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: 'right' }}>Check In</th>
                <th style={{ ...th, textAlign: 'right' }}>Check Out</th>
                <th style={{ ...th, textAlign: 'right' }}>Hours</th>
                <th style={th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...td, textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
                    No attendance records for {MONTHS[selectedMonth - 1]} {year}
                  </td>
                </tr>
              ) : (logs ?? []).map((log, i) => {
                const badge = statusBadge(log.day_status)
                const rowBg = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'
                const hrs = log.hours_worked ? Math.round(Number(log.hours_worked) * 10) / 10 : null
                return (
                  <tr key={log.work_date} style={{ background: rowBg }}>
                    <td style={{ ...td, fontWeight: 600 }}>{formatDate(log.work_date)}</td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
                        fontSize: '0.72rem', fontWeight: 600, background: badge.bg, color: badge.color,
                      }}>{badge.label}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{formatTime(log.check_in)}</td>
                    <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{formatTime(log.check_out)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>
                      {hrs !== null ? `${hrs}h` : '—'}
                    </td>
                    <td style={{ ...td, color: 'var(--muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.notes ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
