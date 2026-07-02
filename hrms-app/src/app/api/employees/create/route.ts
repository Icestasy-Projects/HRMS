import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Verify caller is super_admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await req.formData()
  const name = form.get('name') as string
  const email = form.get('email') as string
  const phone = (form.get('phone') as string) || null
  const role = form.get('role') as string
  const departmentId = (form.get('department_id') as string) || null
  const employeeType = (form.get('employee_type') as string) || 'white_collar'
  const managerId = (form.get('manager_id') as string) || null

  const admin = createAdminClient()

  // Create auth user with default password
  const { data: created, error: authErr } = await admin.auth.admin.createUser({
    email,
    password: 'Test@123',
    email_confirm: true,
    user_metadata: { name, role, employee_type: employeeType },
  })

  if (authErr || !created?.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create auth user' }, { status: 500 })
  }

  const uid = created.user.id

  const { error: upsertErr } = await admin.from('users').upsert({
    id: uid,
    email,
    name,
    phone,
    role,
    department_id: departmentId,
    employee_type: employeeType,
    manager_id: managerId || null,
    is_active: true,
    must_change_password: true,
  }, { onConflict: 'id' })

  if (upsertErr) {
    // Rollback auth user
    await admin.auth.admin.deleteUser(uid)
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  await admin.from('leave_balances').upsert({
    user_id: uid,
    year: new Date().getFullYear(),
    sl_total: 18, sl_used: 0,
    ul_total: 6, ul_used: 0,
  }, { onConflict: 'user_id,year' })

  return NextResponse.json({ id: uid })
}
