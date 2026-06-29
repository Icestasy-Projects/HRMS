import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const USERS = [
  { id: '75c4b656-f1c4-44f3-8199-8f1ffaa17b15', email: 'employee@icestasy.com',   password: 'Emp@12345',   name: 'Employee12',   role: 'employee' },
  { id: '75cc045b-c039-45cf-92bc-38da1fe8e677', email: 'admin@icestasy.com',      password: 'Admin@12345', name: 'Admin12',      role: 'admin' },
  { id: 'cf5806b6-824b-44a7-9bc5-f31598b3e56d', email: 'superadmin@icestasy.com', password: 'Super@12345', name: 'SuperAdmin12', role: 'super_admin' },
]

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const results = []

  for (const u of USERS) {
    // PATCH password directly using known ID
    const patchRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${u.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ password: u.password, email_confirm: true }),
    })
    const patchBody = await patchRes.json()

    if (!patchRes.ok) {
      results.push({ email: u.email, status: 'error', httpStatus: patchRes.status, message: patchBody?.msg ?? JSON.stringify(patchBody) })
      continue
    }

    // Upsert public.users
    await supabase.from('users').upsert({
      id: u.id, email: u.email, name: u.name,
      role: u.role, employee_type: 'white_collar',
    }, { onConflict: 'id' })

    // Upsert leave_balances
    await supabase.from('leave_balances').upsert({
      employee_id: u.id,
      scheduled_balance: 12, scheduled_total: 12,
      unscheduled_balance: 6, unscheduled_total: 6,
    }, { onConflict: 'employee_id' })

    results.push({ email: u.email, role: u.role, password: u.password, status: 'ok' })
  }

  return NextResponse.json({ results })
}
