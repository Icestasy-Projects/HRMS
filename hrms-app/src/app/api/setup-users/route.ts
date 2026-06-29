import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const USERS = [
  { email: 'employee@icestasy.com', password: 'Emp@12345', name: 'Test Employee', role: 'employee' },
  { email: 'admin@icestasy.com', password: 'Admin@12345', name: 'Test Admin', role: 'admin' },
  { email: 'superadmin@icestasy.com', password: 'Super@12345', name: 'Test SuperAdmin', role: 'super_admin' },
]

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY is not set. Go to Vercel → Project Settings → Environment Variables and add it, then redeploy.'
    }, { status: 500 })
  }

  if (!supabaseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL is not set.' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const results = []

  for (const u of USERS) {
    // Use direct fetch to Supabase Auth Admin API for clearer error messages
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({
        email: u.email,
        password: u.password,
        email_confirm: true,
      }),
    })

    const createBody = await createRes.json()

    let finalId: string | undefined = createBody?.id

    if (!createRes.ok) {
      const errMsg: string = createBody?.msg || createBody?.message || createBody?.error_description || JSON.stringify(createBody)
      const alreadyExists = errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('registered') || createRes.status === 422

      if (!alreadyExists) {
        results.push({ email: u.email, status: 'auth_error', httpStatus: createRes.status, message: errMsg })
        continue
      }

      // User already exists — look them up
      const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        },
      })
      const listBody = await listRes.json()
      const existing = (listBody?.users ?? []).find((x: { email: string; id: string }) => x.email === u.email)
      finalId = existing?.id
    }

    if (!finalId) {
      results.push({ email: u.email, status: 'error', message: 'Could not resolve user id after create/lookup' })
      continue
    }

    const { error: dbError } = await supabase.from('users').upsert({
      id: finalId,
      email: u.email,
      name: u.name,
      role: u.role,
      employee_type: 'white_collar',
    }, { onConflict: 'id' })

    await supabase.from('leave_balances').upsert({
      employee_id: finalId,
      scheduled_balance: 12,
      scheduled_total: 12,
      unscheduled_balance: 6,
      unscheduled_total: 6,
    }, { onConflict: 'employee_id' })

    results.push({
      email: u.email,
      role: u.role,
      password: u.password,
      status: dbError ? 'db_error' : 'ok',
      message: dbError?.message ?? null,
    })
  }

  return NextResponse.json({ results })
}
