import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HolidaysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin','sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: holidays } = await admin
    .from('holiday_calendar')
    .select('id, name, holiday_date, type')
    .order('holiday_date', { ascending: true })

  async function addHoliday(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return
    const admin = createAdminClient()
    const dateStr = formData.get('date') as string
    const holidayYear = new Date(dateStr + 'T00:00:00').getFullYear()
    const dow = new Date(dateStr + 'T00:00:00').getDay() // 0=Sun, 6=Sat

    await admin.from('holiday_calendar').insert({
      name: formData.get('name') as string,
      holiday_date: dateStr,
      type: 'public',
    })

    const isWeekendForAll = dow === 0
    const isWeekendWhiteOnly = dow === 6

    if (isWeekendForAll || isWeekendWhiteOnly) {
      const { data: allUsers } = await admin
        .from('users')
        .select('id, employee_type')
        .eq('is_active', true)

      const eligibleUsers = (allUsers ?? []).filter(u => {
        if (isWeekendWhiteOnly && u.employee_type === 'blue_collar') return false
        return true
      })

      const userIds = eligibleUsers.map(u => u.id)
      if (userIds.length > 0) {
        const { data: balances } = await admin
          .from('leave_balances')
          .select('id, user_id, sl_total')
          .in('user_id', userIds)
          .eq('year', holidayYear)

        const balMap = new Map((balances ?? []).map(b => [b.user_id, b]))

        const toUpdate = eligibleUsers.filter(u => balMap.has(u.id))
        const toInsert = eligibleUsers.filter(u => !balMap.has(u.id))

        await Promise.all([
          ...toUpdate.map(u => {
            const bal = balMap.get(u.id)!
            return admin.from('leave_balances')
              .update({ sl_total: (bal.sl_total ?? 0) + 1 })
              .eq('id', bal.id)
          }),
          ...(toInsert.length > 0 ? [admin.from('leave_balances').insert(
            toInsert.map(u => ({ user_id: u.id, year: holidayYear, sl_total: 1, ul_total: 0 }))
          )] : []),
        ])
      }
    }

    redirect('/manage/holidays')
  }

  async function deleteHoliday(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) return
    const admin = createAdminClient()

    const id = formData.get('id') as string

    // Fetch holiday details before deleting so we can reverse any SL credit
    const { data: holiday } = await admin
      .from('holiday_calendar')
      .select('holiday_date')
      .eq('id', id)
      .single()

    if (holiday) {
      const dateStr = holiday.holiday_date as string
      const holidayYear = new Date(dateStr + 'T00:00:00').getFullYear()
      const dow = new Date(dateStr + 'T00:00:00').getDay()

      const isWeekendForAll = dow === 0   // Sunday
      const isWeekendWhiteOnly = dow === 6 // Saturday

      if (isWeekendForAll || isWeekendWhiteOnly) {
        const { data: allUsers } = await admin
          .from('users')
          .select('id, employee_type')
          .eq('is_active', true)

        const eligibleUsers = (allUsers ?? []).filter(u => {
          if (isWeekendWhiteOnly && u.employee_type === 'blue_collar') return false
          return true
        })

        const userIds = eligibleUsers.map(u => u.id)
        if (userIds.length > 0) {
          const { data: balances } = await admin
            .from('leave_balances')
            .select('id, user_id, sl_total')
            .in('user_id', userIds)
            .eq('year', holidayYear)

          await Promise.all(
            (balances ?? []).map(bal =>
              admin.from('leave_balances')
                .update({ sl_total: Math.max(0, (bal.sl_total ?? 0) - 1) })
                .eq('id', bal.id)
            )
          )
        }
      }
    }

    await admin.from('holiday_calendar').delete().eq('id', id)
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
                {new Date(h.holiday_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
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
            <label htmlFor="holiday-name" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Holiday Name
            </label>
            <input
              id="holiday-name"
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
            <label htmlFor="holiday-date" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Date
            </label>
            <input
              id="holiday-date"
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
              color: '#fff',
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
