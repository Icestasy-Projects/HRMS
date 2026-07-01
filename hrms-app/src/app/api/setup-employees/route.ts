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

  // Fetch all auth users once
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) {
    return NextResponse.json({ error: 'Failed to list users', detail: listErr.message }, { status: 500 })
  }
  const existingUsers = listData?.users ?? []

  const results = []

  for (const u of USERS) {
    const existing = existingUsers.find(au => au.email === u.email)

    if (existing) {
      // User exists in auth — update their metadata and password
      await supabase.auth.admin.updateUserById(existing.id, {
        password: 'Emp@12345',
        user_metadata: { name: u.name, role: u.role, employee_type: 'white_collar' },
      })

      // Upsert public.users
      const { error: uErr } = await supabase.from('users').upsert({
        id: existing.id, email: u.email, name: u.name,
        role: u.role, employee_type: 'white_collar', is_active: true,
      }, { onConflict: 'id' })

      // Upsert leave_balances
      await supabase.from('leave_balances').upsert({
        user_id: existing.id,
        year: new Date().getFullYear(),
        sl_total: 18, sl_used: 0,
        ul_total: 6, ul_used: 0,
      }, { onConflict: 'user_id,year' })

      results.push({ email: u.email, name: u.name, role: u.role, status: 'synced', id: existing.id, upsert_error: uErr?.message })
    } else {
      // User does not exist — try to create
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'Emp@12345',
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role, employee_type: 'white_collar' },
      })

      if (createErr || !created?.user) {
        results.push({ email: u.email, status: 'create_error', message: createErr?.message })
        continue
      }

      const uid = created.user.id

      await supabase.from('users').upsert({
        id: uid, email: u.email, name: u.name,
        role: u.role, employee_type: 'white_collar', is_active: true,
      }, { onConflict: 'id' })

      await supabase.from('leave_balances').upsert({
        user_id: uid,
        year: new Date().getFullYear(),
        sl_total: 18, sl_used: 0,
        ul_total: 6, ul_used: 0,
      }, { onConflict: 'user_id,year' })

      results.push({ email: u.email, name: u.name, role: u.role, status: 'created', id: uid })
    }
  }

  return NextResponse.json({ results })
}
