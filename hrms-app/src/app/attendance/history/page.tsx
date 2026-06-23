import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { formatTime } from '@/lib/attendance'

export default async function AttendanceHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase.from('users').select('*').eq('email', user.email).single()
  if (!employee) redirect('/login')

  const { data: logs } = await supabase
    .from('attendance_logs').select('*').eq('employee_id', employee.id).order('date', { ascending: false }).limit(60)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Attendance History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Your last 60 days of attendance records.</p>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="rounded-2xl border p-10 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No attendance records yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="rounded-2xl border p-4 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{format(new Date(log.date), 'EEEE, d MMM yyyy')}</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                  {log.clock_in ? formatTime(log.clock_in) : '--:--'} – {log.clock_out ? formatTime(log.clock_out) : 'ongoing'}
                </div>
              </div>
              <span className="rounded-full px-3 py-1 text-sm font-medium"
                style={{
                  background: log.is_half_day ? 'rgba(245,158,11,0.15)' : log.status === 'absent' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                  color: log.is_half_day ? 'var(--warning)' : log.status === 'absent' ? 'var(--danger)' : 'var(--success)',
                }}>
                {log.is_half_day ? 'Half day' : log.status === 'absent' ? 'Absent' : 'Present'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
