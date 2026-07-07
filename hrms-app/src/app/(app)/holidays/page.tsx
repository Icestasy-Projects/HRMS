import Breadcrumb from '@/components/Breadcrumb'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HolidaysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const year = new Date().getFullYear()

  const { data: holidays } = await supabase
    .from('holiday_calendar')
    .select('*')
    .eq('year', year)
    .order('holiday_date', { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = holidays?.filter(h => new Date(h.holiday_date + 'T00:00:00') >= today) ?? []
  const past = holidays?.filter(h => new Date(h.holiday_date + 'T00:00:00') < today) ?? []

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function getDaysUntil(d: string) {
    const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Holidays' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Public Holidays {year}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {holidays?.length ?? 0} holiday{holidays?.length !== 1 ? 's' : ''} this year · {upcoming.length} upcoming
        </p>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
          }}>
            Upcoming
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {upcoming.map((h, idx) => {
              const isFirst = idx === 0
              return (
                <div key={h.id} style={{
                  background: 'var(--surface)',
                  border: `1px solid ${isFirst ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '0.875rem',
                  padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '0.75rem', flexWrap: 'wrap',
                  boxShadow: isFirst ? '0 0 0 3px rgba(124,47,201,0.08)' : 'var(--shadow)',
                }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{h.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>{formatDate(h.holiday_date)}</p>
                  </div>
                  <span style={{
                    background: isFirst ? 'rgba(124,47,201,0.12)' : 'var(--surface2)',
                    color: isFirst ? 'var(--primary)' : 'var(--muted)',
                    border: `1px solid ${isFirst ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '999px', padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
                  }}>
                    {getDaysUntil(h.holiday_date)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem',
          }}>
            Past
          </h2>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
          }}>
            {past.map((h, idx) => (
              <div key={h.id} style={{
                padding: '0.875rem 1.25rem',
                borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.75rem', opacity: 0.65,
              }}>
                <div>
                  <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{h.name}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>{formatDate(h.holiday_date)}</p>
                </div>
                <span style={{
                  background: 'var(--surface2)', color: 'var(--muted)',
                  borderRadius: '999px', padding: '0.2rem 0.625rem',
                  fontSize: '0.72rem', fontWeight: 600,
                }}>
                  Past
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!holidays || holidays.length === 0) && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '3rem', textAlign: 'center',
          color: 'var(--muted)', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📅</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No holidays added yet</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Ask your admin to add public holidays for {year}.</p>
        </div>
      )}
    </div>
  )
}
