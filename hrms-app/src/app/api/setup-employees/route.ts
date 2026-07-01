import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const EMAILS = [
  'parag.chaphekar@icestasyprojects.com',
  'kaushal.bavishi@icestasyprojects.com',
  'riya.raghani@icestasyprojects.com',
  'mansi.bhagwat@icestasyprojects.com',
  'pranav.ughade@icestasyprojects.com',
  'siddhika.doke@icestasyprojects.com',
  'dhiraj.wadhawa@icestasyprojects.com',
  'pratik.jadhav@icestasyprojects.com',
  'siddharth.singh@icestasyprojects.com',
  'sonu.karande@icestasyprojects.com',
  'viraj.dandwate@icestasyprojects.com',
  'pratik.kawre@icestasyprojects.com',
  'dakshata.warankar@icestasyprojects.com',
  'sushant.kulkarni@icestasyprojects.com',
  'faisal.masood@icestasyprojects.com',
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

  for (const email of EMAILS) {
    // Find user by email
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
    const authUser = users?.find(u => u.email === email)

    if (!authUser) {
      results.push({ email, status: 'not_found' })
      continue
    }

    // Set password via admin API
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ password: 'Emp@12345', email_confirm: true }),
    })

    const body = await res.json()
    if (!res.ok) {
      results.push({ email, status: 'error', message: body?.msg ?? JSON.stringify(body) })
    } else {
      results.push({ email, status: 'ok', id: authUser.id })
    }
  }

  return NextResponse.json({ results })
}
