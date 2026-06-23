import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function NewEmployeePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentEmployee } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (!currentEmployee || currentEmployee.role !== 'super_admin') redirect('/dashboard')

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .order('name')

  async function createEmployee(formData: FormData) {
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

    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const initial_password = formData.get('initial_password') as string
    const employee_type = formData.get('employee_type') as string
    const department_id = formData.get('department_id') as string || null
    const role = formData.get('role') as string

    // Create Supabase auth user using admin API
    const adminClient = await createClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: initial_password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      // Surface error via redirect with message
      const msg = encodeURIComponent(authError?.message ?? 'Failed to create user account')
      redirect(`/manage/employees/new?error=${msg}`)
    }

    const { error: empError } = await supabase
      .from('users')
      .insert({
        user_id: authData.user.id,
        full_name,
        email,
        employee_type,
        department_id,
        role,
        is_active: true,
      })

    if (empError) {
      // Attempt to clean up auth user on failure
      await adminClient.auth.admin.deleteUser(authData.user.id)
      const msg = encodeURIComponent('Employee record could not be created. The account was rolled back.')
      redirect(`/manage/employees/new?error=${msg}`)
    }

    revalidatePath('/manage/employees')
    redirect('/manage/employees')
  }

  return (
    <NewEmployeeForm
      departments={departments ?? []}
      createEmployee={createEmployee}
    />
  )
}

async function NewEmployeeForm({
  departments,
  createEmployee,
  searchParams,
}: {
  departments: { id: string; name: string }[]
  createEmployee: (formData: FormData) => Promise<void>
  searchParams?: Promise<{ error?: string }>
}) {
  const params = searchParams ? await searchParams : null
  const errorMsg = params?.error

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-gray-500 text-sm mt-1">
          Creates a login account and employee record. The employee will use the initial password to sign in.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-medium">
          {decodeURIComponent(errorMsg)}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <form action={createEmployee} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              placeholder="Jane Smith"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@icestasy.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="initial_password" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Password
            </label>
            <input
              id="initial_password"
              name="initial_password"
              type="text"
              required
              minLength={8}
              placeholder="Temporary password (employee should change this)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            />
            <p className="text-xs text-gray-500 mt-1">Share this with the employee. They can change it after signing in.</p>
          </div>

          <div>
            <label htmlFor="employee_type" className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
            <select
              id="employee_type"
              name="employee_type"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="white_collar">White Collar (Mon–Fri, 9 hours/day)</option>
              <option value="blue_collar">Blue Collar (Mon–Sat, 8 hours/day)</option>
            </select>
          </div>

          <div>
            <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              id="department_id"
              name="department_id"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="">— No department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              id="role"
              name="role"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px]"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin (team manager)</option>
              <option value="super_admin">Super Admin (HR / company-wide)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 min-h-[44px] text-sm flex-1"
            >
              Create Employee
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
