import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const inputStyle = {
  width: '100%', background: 'var(--surface2)',
  border: '1px solid var(--border)', borderRadius: '0.75rem',
  padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none',
  boxSizing: 'border-box' as const, fontSize: '0.875rem',
}

export default async function PolicyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const { data: policies } = await supabase
    .from('leave_policy')
    .select('*')
    .order('employee_type')

  async function savePolicy(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const types = ['blue_collar', 'white_collar']
    for (const type of types) {
      await supabase.from('leave_policy').update({
        sl_annual: Number(formData.get(`sl_annual_${type}`)),
        ul_annual: Number(formData.get(`ul_annual_${type}`)),
        max_carry_forward: Number(formData.get(`max_carry_forward_${type}`)),
        salary_deduction_multiplier: Number(formData.get(`salary_deduction_multiplier_${type}`)),
        daily_hours_required: Number(formData.get(`daily_hours_required_${type}`)),
        working_days_per_week: Number(formData.get(`working_days_per_week_${type}`)),
      }).eq('employee_type', type)
    }
    redirect('/manage/policy')
  }

  const typeLabel = (t: string) => t === 'blue_collar' ? 'Blue Collar' : 'White Collar'

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
        Leave Policy
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Configure leave entitlements per employee type
      </p>

      <form action={savePolicy} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {policies?.map(p => (
          <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem' }}>
            <p style={{ fontWeight: 700, color: 'var(--text)', margin: '0 0 1rem', fontSize: '0.95rem' }}>
              {typeLabel(p.employee_type)}
            </p>
            <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {[
                { name: `sl_annual_${p.employee_type}`, label: 'Scheduled Leave Days / Year', value: p.sl_annual },
                { name: `ul_annual_${p.employee_type}`, label: 'Unscheduled Leave Days / Year', value: p.ul_annual },
                { name: `max_carry_forward_${p.employee_type}`, label: 'Max Carry Forward Days', value: p.max_carry_forward },
                { name: `salary_deduction_multiplier_${p.employee_type}`, label: 'Salary Deduction Multiplier', value: p.salary_deduction_multiplier },
                { name: `daily_hours_required_${p.employee_type}`, label: 'Daily Hours Required', value: p.daily_hours_required },
                { name: `working_days_per_week_${p.employee_type}`, label: 'Working Days / Week', value: p.working_days_per_week },
              ].map(field => (
                <div key={field.name}>
                  <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '0.375rem' }}>
                    {field.label}
                  </label>
                  <input
                    name={field.name}
                    type="number"
                    step="0.01"
                    defaultValue={field.value}
                    required
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="submit" style={{
          background: 'var(--primary)', color: '#fff', border: 'none',
          borderRadius: '0.75rem', padding: '0.875rem',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
        }}>
          Save Policy
        </button>
      </form>
    </div>
  )
}
