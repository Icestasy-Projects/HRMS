import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManageEmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!currentEmployee || currentEmployee.role !== 'super_admin') redirect('/dashboard')

  const { data: employees } = await supabase
    .from('employees')
    .select('*, department:departments(name)')
    .order('full_name')

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-1">All employee accounts in the system.</p>
        </div>
        <Link
          href="/manage/employees/new"
          className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 text-sm min-h-[44px] flex items-center shrink-0"
        >
          + Add Employee
        </Link>
      </div>

      {(!employees || employees.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No employees yet. Add the first one above.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {emp.employee_type === 'white_collar' ? 'White Collar' : 'Blue Collar'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{(emp.department as { name?: string })?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{emp.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      {emp.is_active
                        ? <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Active</span>
                        : <span className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium">Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/manage/employees/${emp.id}`} className="text-blue-700 hover:underline font-medium text-sm">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {employees.map((emp) => (
              <div key={emp.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{emp.full_name}</span>
                  {emp.is_active
                    ? <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-medium">Active</span>
                    : <span className="bg-red-100 text-red-800 rounded-full px-3 py-1 text-sm font-medium">Inactive</span>
                  }
                </div>
                <div className="text-sm text-gray-500 space-y-0.5">
                  <div>{emp.email}</div>
                  <div>{emp.employee_type === 'white_collar' ? 'White Collar' : 'Blue Collar'} · {emp.role.replace('_', ' ')}</div>
                  <div>{(emp.department as { name?: string })?.name ?? 'No department'}</div>
                </div>
                <Link href={`/manage/employees/${emp.id}`} className="text-blue-700 hover:underline font-medium text-sm mt-1 inline-block">
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
