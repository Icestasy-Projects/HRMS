import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime } from '@/lib/attendance'

export default async function AttendanceHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!employee) redirect('/login')

  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', employee.id)
    .order('work_date', { ascending: false })
    .limit(60)

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Attendance History
      </h1>

      {(!logs || logs.length === 0) ? (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          No attendance records found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {logs.map(log => {
            const isHalf = log.day_status?.includes('half_day')
            const badgeColor = isHalf
              ? 'var(--warning)'
              : log.check_out
                ? 'var(--success)'
                : 'var(--primary)'
            const badgeLabel = isHalf ? 'Half Day' : log.check_out ? 'Present' : 'In Progress'

            return (
              <div
                key={log.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>
                    {new Date(log.work_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    {formatTime(log.check_in)} → {formatTime(log.check_out)}
                  </p>
                </div>
                <span
                  style={{
                    background: `${badgeColor}20`,
                    color: badgeColor,
                    border: `1px solid ${badgeColor}`,
                    borderRadius: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {badgeLabel}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
