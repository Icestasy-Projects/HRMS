import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function LeavePolicyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: policy } = await supabase.from('leave_policy').select('*').single()

  async function savePolicy(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
    if (!me || me.role !== 'super_admin') return

    const vals = {
      scheduled_days:              Number(formData.get('scheduled_days')),
      unscheduled_days:            Number(formData.get('unscheduled_days')),
      max_carryforward:            Number(formData.get('max_carryforward')),
      half_day_scheduled_cost:     Number(formData.get('half_day_scheduled_cost')),
      half_day_unscheduled_cost:   Number(formData.get('half_day_unscheduled_cost')),
      unpaid_multiplier:           Number(formData.get('unpaid_multiplier')),
    }

    const { data: existing } = await supabase.from('leave_policy').select('id').single()
    if (existing) {
      await supabase.from('leave_policy').update(vals).eq('id', existing.id)
    } else {
      await supabase.from('leave_policy').insert(vals)
    }

    revalidatePath('/manage/policy')
  }

  const p = policy ?? {
    scheduled_days: 18,
    unscheduled_days: 6,
    max_carryforward: 12,
    half_day_scheduled_cost: 0.5,
    half_day_unscheduled_cost: 0.75,
    unpaid_multiplier: 1.5,
  }

  const fields = [
    {
      name: 'scheduled_days',
      label: 'Annual Scheduled Leave Days',
      description: 'How many planned leave days each employee gets per year.',
      value: p.scheduled_days,
      step: '1', min: '1',
    },
    {
      name: 'unscheduled_days',
      label: 'Annual Unscheduled Leave Days',
      description: 'How many sick / emergency days each employee gets per year.',
      value: p.unscheduled_days,
      step: '1', min: '0',
    },
    {
      name: 'max_carryforward',
      label: 'Maximum Days Carried Forward',
      description: 'At year-end, up to this many unused scheduled days roll into next year. Anything over this limit is lost.',
      value: p.max_carryforward,
      step: '1', min: '0',
    },
    {
      name: 'half_day_scheduled_cost',
      label: 'Scheduled Half-Day Deduction',
      description: 'How many days a half-day of scheduled leave costs (currently 0.5).',
      value: p.half_day_scheduled_cost,
      step: '0.25', min: '0',
    },
    {
      name: 'half_day_unscheduled_cost',
      label: 'Unscheduled Half-Day Deduction',
      description: 'How many days a half-day of unscheduled leave costs (currently 0.75).',
      value: p.half_day_unscheduled_cost,
      step: '0.25', min: '0',
    },
    {
      name: 'unpaid_multiplier',
      label: 'Unpaid Leave Pay Deduction Multiplier',
      description: 'When an employee has no leave balance, each day off costs this multiple of their daily pay (currently 1.5×).',
      value: p.unpaid_multiplier,
      step: '0.1', min: '1',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Leave Policy</h1>
        <p className="text-gray-500 text-sm mt-1">
          These settings apply to all employees company-wide. Changes take effect immediately.
        </p>
      </div>

      <form action={savePolicy} className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-5">
          {fields.map(f => (
            <div key={f.name}>
              <label htmlFor={f.name} className="block text-sm font-semibold text-gray-800 mb-0.5">
                {f.label}
              </label>
              <p className="text-xs text-gray-500 mb-2">{f.description}</p>
              <input
                id={f.name}
                name={f.name}
                type="number"
                step={f.step}
                min={f.min}
                defaultValue={f.value}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px] max-w-[160px]"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 min-h-[44px] transition-colors"
        >
          Save Policy
        </button>
      </form>
    </div>
  )
}
