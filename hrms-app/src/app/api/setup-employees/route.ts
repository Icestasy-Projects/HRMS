import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const USERS = [
  { email: 'parag.chaphekar@icestasyprojects.com',   name: 'Parag Chaphekar',           role: 'super_admin' },
  { email: 'kaushal.bavishi@icestasyprojects.com',   name: 'Kaushal Bavishi',           role: 'admin' },
  { email: 'riya.raghani@icestasyprojects.com',      name: 'Riya Raghani',              role: 'admin' },
  { email: 'mansi.bhagwat@icestasyprojects.com',     name: 'Mansi Bhagwat',             role: 'super_admin' },
  { email: 'pranav.ughade@icestasyprojects.com',     name: 'Pranav Ughade',             role: 'admin' },
  { email: 'siddhika.doke@icestasyprojects.com',     name: 'Siddhika Doke',             role: 'admin' },
  { email: 'dhiraj.wadhawa@icestasyprojects.com',    name: 'Dhiraj Wadhawa',            role: 'admin' },
  { email: 'pratik.jadhav@icestasyprojects.com',     name: 'Pratik Jadhav',             role: 'admin' },
  { email: 'siddharth.singh@icestasyprojects.com',   name: 'Siddharth Singh',           role: 'admin' },
  { email: 'sonu.karande@icestasyprojects.com',      name: 'Sonu Karande',              role: 'admin' },
  { email: 'viraj.dandwate@icestasyprojects.com',    name: 'Viraj Dandwate',            role: 'admin' },
  { email: 'pratik.kawre@icestasyprojects.com',      name: 'Pratik Pandurang Kawre',    role: 'admin' },
  { email: 'dakshata.warankar@icestasyprojects.com', name: 'Dakshata Sharad Warankar',  role: 'admin' },
  { email: 'sushant.kulkarni@icestasyprojects.com',  name: 'Sushant Ravindra Kulkarni', role: 'admin' },
  { email: 'faisal.masood@icestasyprojects.com',     name: 'Md Faisal Masood',          role: 'admin' },
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
    // Check if auth user already exists
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    let authUser = users?.find(au => au.email === u.email)

    if (!authUser) {
      // Create via SDK admin API
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'Emp@12345',
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role, employee_type: 'white_collar' },
      })
      if (createErr || !created?.user) {
        results.push({ email: u.email, status: 'create_error', message: createErr?.message ?? 'no user returned' })
        continue
      }
      authUser = created.user
    } else {
      // Update password
      await supabase.auth.admin.updateUserById(authUser.id, {
        password: 'Emp@12345',
        email_confirm: true,
      })
    }

    if (!authUser?.id) { results.push({ email: u.email, status: 'no_id' }); continue }

    // Upsert public.users
    const { error: upsertErr } = await supabase.from('users').upsert({
      id: authUser.id, email: u.email, name: u.name,
      role: u.role, employee_type: 'white_collar', is_active: true,
    }, { onConflict: 'id' })

    if (upsertErr) {
      results.push({ email: u.email, status: 'upsert_error', message: upsertErr.message })
      continue
    }

    // Upsert leave_balances
    await supabase.from('leave_balances').upsert({
      user_id: authUser.id,
      year: new Date().getFullYear(),
      sl_total: 18, sl_used: 0,
      ul_total: 6, ul_used: 0,
    }, { onConflict: 'user_id,year' })

    results.push({ email: u.email, name: u.name, role: u.role, status: 'ok', id: authUser.id })
  }

  return NextResponse.json({ results })
}
