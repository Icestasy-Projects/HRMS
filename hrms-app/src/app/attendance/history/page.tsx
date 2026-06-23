import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime } from '@/lib/attendance'
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import Link from 'next/link'

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!employee) redirect('/login')

  const params = await searchParams
  const monthParam = params?.month
  const currentMonth = monthParam ? new Date(monthParam + '-01') : new Date()
  const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
  const prevMonth = format(subMonths(currentMonth, 1), 'yyyy-MM')
  const nextMonth = format(addMonths(currentMonth, 1), 'yyyy-MM')
  const thisMonth = format(new Date(), 'yyyy-MM')
  const isThisMonth = format(currentMonth, 'yyyy-MM') === thisMonth

  const { data: records } = await supabase
    .from('v_attendance_with_names')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })

  function statusBadge(status: string, isHalfDay: boolean) {
    if (isHalfDay) return <span className="bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium">Half Day</span>
    if (status === 'present') return <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Full Day</span>
    if (status === 'absent') return <span className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium">Absent</span>
    if (status === 'holiday') return <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">Holiday</span>
    if (status === 'weekend') return <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">Weekend</span>
    return <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">{status}</span>
  }

  function calcHours(clockIn: string | null, clockOut: string | null): string {
    if (!clockIn || !clockOut) return '—'
    const parse = (t: string) => {
      const time = t.includes('T') ? t.split('T')[1] : t
      const [h, m] = time.slice(0, 5).split(':').map(Number)
      return h * 60 + m
    }
    const diff = parse(clockOut) - parse(clockIn)
    if (diff < 0) return '—'
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return m === 0 ? `${h}h` : `${h}h ${m}m`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Attendance History</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your complete attendance record. Each row shows when you clocked in and out.
        </p>
      </div>

      {/* Month navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <Link
          href={`/attendance/history?month=${prevMonth}`}
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2.5 font-semibold hover:bg-gray-200 text-sm min-h-[44px] flex items-center"
        >
          ← Previous
        </Link>
        <span className="font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</span>
        <Link
          href={isThisMonth ? '#' : `/attendance/history?month=${nextMonth}`}
          className={`rounded-lg px-4 py-2.5 font-semibold text-sm min-h-[44px] flex items-center ${
            isThisMonth
              ? 'bg-gray-50 text-gray-300 cursor-default'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Next →
        </Link>
      </div>

      {/* Records */}
      {(!records || records.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No attendance records for {format(currentMonth, 'MMMM yyyy')}.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Day</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Clock In</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Clock Out</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Hours</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {format(new Date(r.date), 'd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(r.date), 'EEE')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-mono">{formatTime(r.clock_in)}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono">{formatTime(r.clock_out)}</td>
                    <td className="px-4 py-3 text-gray-700">{calcHours(r.clock_in, r.clock_out)}</td>
                    <td className="px-4 py-3">{statusBadge(r.status, r.is_half_day)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {records.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">
                    {format(new Date(r.date), 'EEE, d MMM')}
                  </span>
                  {statusBadge(r.status, r.is_half_day)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatTime(r.clock_in)} – {formatTime(r.clock_out)}
                  {r.clock_in && r.clock_out && (
                    <span className="ml-2 text-gray-400">({calcHours(r.clock_in, r.clock_out)})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
