import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentEmployee } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!currentEmployee || currentEmployee.role !== 'super_admin') redirect('/dashboard')

  const { id } = await params
  const { data: emp, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !emp) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          Employee not found.
        </div>
      </div>
    )
  }

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name')

  async function updateEmployee(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentEmployee } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (!currentEmployee || currentEmployee.role !== 'super_admin') return

    const empId = formData.get('emp_id') as string
    const full_name = formData.get('full_name') as string
    const employee_type = formData.get('employee_type') as string
    const department_id = formData.get('department_id') as string || null
    const role = formData.get('role') as string
    const is_active = formData.get('is_active') === 'true'

    const { error } = await supabase
      .from('users')
      .update({ full_name, employee_type, department_id, role, is_active })
      .eq('id', empId)

    if (error) return

    revalidatePath('/manage/employees')
    redirect('/manage/employees')
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit Employee</h1>
        <p className="text-gray-500 text-sm mt-1">Update employee details below.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form action={updateEmployee} className="space-y-4">
          <input type="hidden" name="emp_id" value={emp.id} />

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={emp.full_name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500 min-h-[44px] flex items-center">
              {emp.email} <span className="text-xs ml-2 text-gray-400">(cannot be changed here)</span>
            </div>
          </div>

          <div>
            <label htmlFor="employee_type" className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
            <select
              id="employee_type"
              name="employee_type"
              defaultValue={emp.employee_type}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="white_collar">White Collar (Mon–Fri, 9h/day)</option>
              <option value="blue_collar">Blue Collar (Mon–Sat, 8h/day)</option>
            </select>
          </div>

          <div>
            <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              id="department_id"
              name="department_id"
              defaultValue={emp.department_id ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="">— No department —</option>
              {(departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              id="role"
              name="role"
              defaultValue={emp.role}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin (team manager)</option>
              <option value="super_admin">Super Admin (HR / company-wide)</option>
            </select>
          </div>

          <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="is_active"
              name="is_active"
              defaultValue={emp.is_active ? 'true' : 'false'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="true">Active</option>
              <option value="false">Inactive (cannot sign in)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 min-h-[44px] text-sm flex-1"
            >
              Save Changes
            </button>
            <a
              href="/manage/employees"
              className="bg-gray-100 text-gray-700 rounded-lg px-5 py-3 font-semibold hover:bg-gray-200 min-h-[44px] text-sm flex items-center justify-center"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
