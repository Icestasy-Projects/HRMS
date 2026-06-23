import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function ManageDepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentEmployee } = await supabase
    .from('employees')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!currentEmployee || currentEmployee.role !== 'super_admin') redirect('/dashboard')

  const { data: departments } = await supabase
    .from('departments')
    .select('*, manager:employees!departments_manager_id_fkey(id, full_name)')
    .order('name')

  const { data: employees } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name')

  const params = await searchParams
  const errorMsg = params?.error
  const editId = params?.edit

  async function saveDepartment(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', user.email)
      .single()
    if (!currentEmployee || currentEmployee.role !== 'super_admin') return

    const deptId = formData.get('dept_id') as string
    const name = (formData.get('name') as string).trim()
    const manager_id = formData.get('manager_id') as string || null

    if (!name) return

    if (deptId) {
      await supabase.from('departments').update({ name, manager_id }).eq('id', deptId)
    } else {
      await supabase.from('departments').insert({ name, manager_id })
    }

    revalidatePath('/manage/departments')
    redirect('/manage/departments')
  }

  const editingDept = editId ? departments?.find(d => d.id === editId) : null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Departments</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your company&apos;s departments and their managers.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-medium">
          {decodeURIComponent(errorMsg)}
        </div>
      )}

      {/* Add / Edit form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">
          {editingDept ? `Edit: ${editingDept.name}` : 'Add New Department'}
        </h2>
        <form action={saveDepartment} className="space-y-4">
          <input type="hidden" name="dept_id" value={editingDept?.id ?? ''} />

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={editingDept?.name ?? ''}
              placeholder="e.g. Operations, Finance"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="manager_id" className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <select
              id="manager_id"
              name="manager_id"
              defaultValue={editingDept?.manager_id ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="">— No manager assigned —</option>
              {(employees ?? []).map(e => (
                <option key={e.id} value={e.id}>{e.full_name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 min-h-[44px] text-sm"
            >
              {editingDept ? 'Save Changes' : 'Add Department'}
            </button>
            {editingDept && (
              <a
                href="/manage/departments"
                className="bg-gray-100 text-gray-700 rounded-lg px-5 py-3 font-semibold hover:bg-gray-200 min-h-[44px] text-sm flex items-center"
              >
                Cancel
              </a>
            )}
          </div>
        </form>
      </div>

      {/* Department list */}
      {departments && departments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Manager</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{dept.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {(dept.manager as { full_name?: string } | null)?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/manage/departments?edit=${dept.id}`} className="text-blue-700 hover:underline font-medium text-sm">
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
