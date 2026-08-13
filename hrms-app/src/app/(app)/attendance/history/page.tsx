import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime } from '@/lib/attendance'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  // Determine month range
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const defaultMonth = `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}`
  const month = params.month ?? defaultMonth
  const [yr, mo] = month.split('-').map(Number)
  const from = `${month}-01`
  const lastDay = new Date(yr, mo, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`

  const statusFilter = params.status ?? 'all'

  let query = supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', employee.id)
    .gte('work_date', from)
    .lte('work_date', to)
    .order('work_date', { ascending: false })

  const { data: logs } = await query

  // Month options — last 6 months
  const monthOptions: { value: string; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(nowIST.getFullYear(), nowIST.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthOptions.push({ value: val, label })
  }

  function badgeInfo(log: { day_status?: string; check_out?: string }) {
    const isHalf = log.day_status?.includes('half_day')
    const isWeekend = log.day_status === 'weekend_work'
    if (isWeekend) return { label: 'Weekend', color: '#6366f1' }
    if (isHalf) return { label: 'Half Day', color: 'var(--warning)' }
    if (log.check_out) return { label: 'Present', color: 'var(--success)' }
    return { label: 'In Progress', color: 'var(--primary)' }
  }

  function calcHours(checkIn?: string | null, checkOut?: string | null) {
    if (!checkIn || !checkOut) return '—'
    try {
      const [ih, im] = checkIn.split(':').map(Number)
      const [oh, om] = checkOut.split(':').map(Number)
      const mins = (oh * 60 + om) - (ih * 60 + im)
      if (mins <= 0) return '—'
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return `${h}h ${m}m`
    } catch { return '—' }
  }

  const filtered = statusFilter === 'all'
    ? (logs ?? [])
    : (logs ?? []).filter(l => badgeInfo(l).label.toLowerCase().replace(' ', '_') === statusFilter || badgeInfo(l).label.toLowerCase() === statusFilter)

  const totalPresent = (logs ?? []).filter(l => badgeInfo(l).label === 'Present').length
  const totalHalf = (logs ?? []).filter(l => badgeInfo(l).label === 'Half Day').length

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Attendance', href: '/attendance' }, { label: 'History' }]} />
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Attendance History
          </h1>
        </div>
        <Link href="/attendance/regularization" style={{
          background: 'var(--primary)', color: '#fff',
          borderRadius: '0.625rem', padding: '0.625rem 1.125rem',
          fontWeight: 600, fontSize: '0.875rem', minHeight: '40px',
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          boxShadow: 'var(--shadow)',
        }}>
          + Request Correction
        </Link>
      </div>

      {/* Summary chips */}
      {logs && logs.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ background: 'var(--success-l, #dcfce7)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700 }}>
            {totalPresent} Present
          </span>
          {totalHalf > 0 && (
            <span style={{ background: '#fef3c7', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 700 }}>
              {totalHalf} Half Day
            </span>
          )}
          <span style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.3rem 0.875rem', fontSize: '0.8rem', fontWeight: 600 }}>
            {logs.length} records
          </span>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <form method="get" style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            name="month"
            defaultValue={month}
            onChange={undefined}
            style={{
              padding: '0.45rem 0.875rem', border: '1px solid var(--border)',
              borderRadius: '0.5rem', background: 'var(--surface)', color: 'var(--text)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none',
            }}
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            style={{
              padding: '0.45rem 0.875rem', border: '1px solid var(--border)',
              borderRadius: '0.5rem', background: 'var(--surface)', color: 'var(--text)',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="half day">Half Day</option>
            <option value="in progress">In Progress</option>
            <option value="weekend">Weekend</option>
          </select>
          <button type="submit" style={{
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.5rem', padding: '0.45rem 1rem',
            fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
          }}>
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      {(!filtered || filtered.length === 0) ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', padding: '3rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>No records found</p>
          <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>Try a different month or status filter.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '540px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Day', 'Check-In', 'Check-Out', 'Duration', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left',
                    fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => {
                const badge = badgeInfo(log)
                const d = new Date(log.work_date + 'T00:00:00')
                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' })
                const isToday = log.work_date === defaultMonth.substring(0, 7) && false // just styling
                return (
                  <tr key={log.id} style={{
                    borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.1s',
                  }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {dateStr}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {dayStr}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--text)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {formatTime(log.check_in)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: log.check_out ? 'var(--text)' : 'var(--muted)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {log.check_out ? formatTime(log.check_out) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      {calcHours(log.check_in, log.check_out)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: `${badge.color}18`, color: badge.color,
                        border: `1px solid ${badge.color}`,
                        borderRadius: '999px', padding: '0.2rem 0.65rem',
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
