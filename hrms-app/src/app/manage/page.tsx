import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ManagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single()
  if (!employee || employee.role !== 'super_admin') redirect('/dashboard')

  const cards = [
    {
      href: '/manage/employees',
      title: 'Manage Employees',
      description: 'Add, edit, or deactivate employee accounts. Assign roles and departments.',
      icon: '👤',
    },
    {
      href: '/manage/departments',
      title: 'Manage Departments',
      description: 'Create and edit departments. Assign department managers.',
      icon: '🏢',
    },
    {
      href: '/manage/policy',
      title: 'Leave Policy',
      description: 'Set annual leave entitlements, carry-forward limits, and deduction rules.',
      icon: '📋',
    },
    {
      href: '/manage/holidays',
      title: 'Holiday Calendar',
      description: 'Add public holidays and company-wide non-working days.',
      icon: '📅',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Company-wide settings and records. Only super administrators can access this area.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="font-semibold text-gray-900 group-hover:text-blue-700 mb-1">{card.title}</div>
            <div className="text-sm text-gray-500">{card.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
