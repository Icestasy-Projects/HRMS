import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const USERS = [
  { email: 'employee@icestasy.com', password: 'Emp@12345', name: 'Employee12', role: 'employee' },
  { email: 'admin@icestasy.com', password: 'Admin@12345', name: 'Admin12', role: 'admin' },
  { email: 'superadmin@icestasy.com', password: 'Super@12345', name: 'SuperAdmin12', role: 'super_admin' },
]

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Fetch all existing auth users
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
    headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey },
  })
  const listBody = await listRes.json()
  const existingUsers: { id: string; email: string }[] = listBody?.users ?? []

  const results = []

  for (const u of USERS) {
    const existing = existingUsers.find(x => x.email === u.email)

    if (existing) {
      // User exists — just update their password via PATCH
      const patchRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existing.id}`, {
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
        results.push({ email: u.email, status: 'patch_error', message: patchBody?.msg ?? JSON.stringify(patchBody) })
        continue
      }

      // Update public.users
      await supabase.from('users').upsert({
        id: existing.id, email: u.email, name: u.name,
        role: u.role, employee_type: 'white_collar',
      }, { onConflict: 'id' })

      await supabase.from('leave_balances').upsert({
        employee_id: existing.id,
        scheduled_balance: 12, scheduled_total: 12,
        unscheduled_balance: 6, unscheduled_total: 6,
      }, { onConflict: 'employee_id' })

      results.push({ email: u.email, role: u.role, password: u.password, status: 'ok', action: 'password_updated' })

    } else {
      // User doesn't exist — create via admin API
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        },
        body: JSON.stringify({ email: u.email, password: u.password, email_confirm: true }),
      })
      const createBody = await createRes.json()
      if (!createRes.ok) {
        results.push({ email: u.email, status: 'create_error', httpStatus: createRes.status, message: createBody?.msg ?? JSON.stringify(createBody) })
        continue
      }

      const newId = createBody.id
      await supabase.from('users').upsert({
        id: newId, email: u.email, name: u.name,
        role: u.role, employee_type: 'white_collar',
      }, { onConflict: 'id' })

      await supabase.from('leave_balances').upsert({
        employee_id: newId,
        scheduled_balance: 12, scheduled_total: 12,
        unscheduled_balance: 6, unscheduled_total: 6,
      }, { onConflict: 'employee_id' })

      results.push({ email: u.email, role: u.role, password: u.password, status: 'ok', action: 'created' })
    }
  }

  return NextResponse.json({ results })
}
