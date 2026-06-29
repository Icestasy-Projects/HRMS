import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const USERS = [
  { email: 'employee@icestasy.com', password: 'Emp@12345', name: 'Test Employee', role: 'employee' },
  { email: 'admin@icestasy.com', password: 'Admin@12345', name: 'Test Admin', role: 'admin' },
  { email: 'superadmin@icestasy.com', password: 'Super@12345', name: 'Test SuperAdmin', role: 'super_admin' },
]

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const results = []

  for (const u of USERS) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (authError && !authError.message.includes('already been registered')) {
      results.push({ email: u.email, status: 'error', message: authError.message })
      continue
    }

    const userId = authData?.user?.id

    // Get id if user already existed
    let finalId = userId
    if (!finalId) {
      const { data: existing } = await supabase.auth.admin.listUsers()
      finalId = existing?.users?.find(x => x.email === u.email)?.id
    }

    if (!finalId) {
      results.push({ email: u.email, status: 'error', message: 'Could not resolve user id' })
      continue
    }

    // Upsert into public.users
    const { error: dbError } = await supabase.from('users').upsert({
      id: finalId,
      email: u.email,
      name: u.name,
      role: u.role,
      employee_type: 'white_collar',
    }, { onConflict: 'id' })

    results.push({
      email: u.email,
      role: u.role,
      password: u.password,
      status: dbError ? 'db_error' : 'ok',
      message: dbError?.message,
    })
  }

  return NextResponse.json({ results })
}
