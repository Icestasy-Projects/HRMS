import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SubmitButton } from '@/components/SubmitButton'

export default async function PolicyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: policy } = await supabase.from('leave_policy').select('*').limit(1).single()

  async function savePolicy(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const updates = {
      scheduled_days_per_year: Number(formData.get('scheduled_days_per_year')),
      unscheduled_days_per_year: Number(formData.get('unscheduled_days_per_year')),
      max_carryforward: Number(formData.get('max_carryforward')),
      unpaid_deduction_multiplier: Number(formData.get('unpaid_deduction_multiplier')),
    }

    const { data: existing } = await supabase.from('leave_policy').select('id').limit(1).single()

    if (existing) {
      await supabase.from('leave_policy').update(updates).eq('id', existing.id)
    } else {
      await supabase.from('leave_policy').insert(updates)
    }

    redirect('/manage/policy')
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Leave Policy
      </h1>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
      >
        <form action={savePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { name: 'scheduled_days_per_year', label: 'Scheduled Days / Year', value: policy?.scheduled_days_per_year ?? 15 },
            { name: 'unscheduled_days_per_year', label: 'Unscheduled Days / Year', value: policy?.unscheduled_days_per_year ?? 10 },
            { name: 'max_carryforward', label: 'Max Carry Forward Days', value: policy?.max_carryforward ?? 12 },
            { name: 'unpaid_deduction_multiplier', label: 'Unpaid Deduction Multiplier', value: policy?.unpaid_deduction_multiplier ?? 1.5 },
          ].map(field => (
            <div key={field.name}>
              <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
                {field.label}
              </label>
              <input
                name={field.name}
                type="number"
                step="0.1"
                defaultValue={field.value}
                required
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 1rem',
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
            </div>
          ))}

          <SubmitButton
            loadingText="Saving..."
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem',
              fontWeight: 600,
              minHeight: '44px',
              marginTop: '0.5rem',
              width: '100%',
            }}
          >
            Save Policy
          </SubmitButton>
        </form>
      </div>
    </div>
  )
}
