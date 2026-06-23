import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatTime } from '@/lib/attendance'
import { format } from 'date-fns'

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!employee) redirect('/login')

  if (employee.role !== 'admin' && employee.role !== 'super_admin') redirect('/dashboard')

  const params = await searchParams
  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch departments for filter (super_admin only)
  let departments: { id: string; name: string }[] = []
  if (employee.role === 'super_admin') {
    const { data } = await supabase.from('departments').select('id, name').order('name')
    departments = data ?? []
  }

  const selectedDept = params?.dept ?? (employee.role === 'admin' ? employee.department_id ?? '' : '')

  // Build attendance query
  let query = supabase
    .from('v_attendance_with_names')
    .select('*')
    .eq('date', today)

  if (selectedDept) {
    // Get employees in that department first
    const { data: deptEmployees } = await supabase
      .from('employees')
      .select('id')
      .eq('department_id', selectedDept)
    const ids = (deptEmployees ?? []).map((e: { id: string }) => e.id)
    if (ids.length > 0) {
      query = query.in('employee_id', ids)
    }
  } else if (employee.role === 'admin' && employee.department_id) {
    const { data: deptEmployees } = await supabase
      .from('employees')
      .select('id')
      .eq('department_id', employee.department_id)
    const ids = (deptEmployees ?? []).map((e: { id: string }) => e.id)
    if (ids.length > 0) {
      query = query.in('employee_id', ids)
    }
  }

  const { data: attendance } = await query.order('full_name')

  function statusBadge(record: { clock_in: string | null; clock_out: string | null; is_half_day: boolean }) {
    if (!record.clock_in) return <span className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm font-medium">Not clocked in</span>
    if (record.clock_in && !record.clock_out) return <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Currently in</span>
    if (record.is_half_day) return <span className="bg-amber-100 text-amber-800 rounded-full px-3 py-1 text-sm font-medium">Half day</span>
    return <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-medium">Full day</span>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Team Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your team&apos;s attendance for today. This is a read-only overview — use &ldquo;Leave Requests&rdquo; to approve or reject time-off requests.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
        <strong>Today:</strong> {format(new Date(), 'EEEE, d MMMM yyyy')}
      </div>

      {/* Department filter (super_admin only) */}
      {employee.role === 'super_admin' && departments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label htmlFor="dept" className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
          <form>
            <select
              id="dept"
              name="dept"
              defaultValue={selectedDept}
              onChange={e => {
                const url = new URL(window.location.href)
                url.searchParams.set('dept', e.target.value)
                window.location.href = url.toString()
              }}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </form>
        </div>
      )}

      {/* Attendance table */}
      {(!attendance || attendance.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No attendance records for today in this view.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Clock In</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Clock Out</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((r) => (
                  <tr key={r.id ?? r.employee_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.department_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono">{formatTime(r.clock_in)}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono">{formatTime(r.clock_out)}</td>
                    <td className="px-4 py-3">{statusBadge(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {attendance.map((r) => (
              <div key={r.id ?? r.employee_id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{r.full_name}</span>
                  {statusBadge(r)}
                </div>
                <div className="text-sm text-gray-500">
                  {r.department_name && <span>{r.department_name} · </span>}
                  {formatTime(r.clock_in)} – {formatTime(r.clock_out)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
