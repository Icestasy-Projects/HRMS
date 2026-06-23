import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HolidaysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('email', user.email).single()
  if (!me || me.role !== 'super_admin') redirect('/dashboard')

  const { data: holidays } = await supabase
    .from('holiday_calendar')
    .select('*')
    .order('date', { ascending: true })

  async function addHoliday(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('holiday_calendar').insert({
      name: formData.get('name') as string,
      date: formData.get('date') as string,
    })
    redirect('/manage/holidays')
  }

  async function deleteHoliday(formData: FormData) {
    'use server'
    const supabase = await createClient()
    await supabase.from('holiday_calendar').delete().eq('id', formData.get('id'))
    redirect('/manage/holidays')
  }

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1.5rem' }}>
        Holiday Calendar
      </h1>

      {/* Existing holidays */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        {(!holidays || holidays.length === 0) ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            No holidays added yet.
          </div>
        ) : holidays.map(h => (
          <div
            key={h.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '0.875rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>{h.name}</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                {new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <form action={deleteHoliday}>
              <input type="hidden" name="id" value={h.id} />
              <button
                type="submit"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid var(--danger)',
                  borderRadius: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* Add holiday form */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Add Holiday
        </h2>
        <form action={addHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Holiday Name
            </label>
            <input
              name="name"
              type="text"
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
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Date
            </label>
            <input
              name="date"
              type="date"
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
          <button
            type="submit"
            style={{
              background: 'var(--primary)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Add Holiday
          </button>
        </form>
      </div>
    </div>
  )
}
