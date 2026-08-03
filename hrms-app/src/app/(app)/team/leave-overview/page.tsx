import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function LeaveOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const admin = createAdminClient()
  const year = new Date().getFullYear()

  // Fetch all active employees
  const { data: employees } = await admin
    .from('users')
    .select('id, name, role, employee_type, departments(name)')
    .eq('is_active', true)
    .order('name')

  if (!employees) redirect('/dashboard')

  // Fetch all leave balances for this year
  const { data: balances } = await admin
    .from('leave_balances')
    .select('user_id, sl_total, ul_total')
    .eq('year', year)

  const balanceMap: Record<string, { sl_total: number; ul_total: number }> = {}
  for (const b of balances ?? []) {
    balanceMap[b.user_id] = { sl_total: b.sl_total ?? 18, ul_total: b.ul_total ?? 6 }
  }

  // Fetch all approved leave requests for this year
  const { data: usedLeaves } = await admin
    .from('leave_requests')
    .select('employee_id, leave_type, days_count')
    .eq('status', 'approved')
    .gte('start_date', `${year}-01-01`)
    .lte('start_date', `${year}-12-31`)

  const usedMap: Record<string, { sl: number; ul: number }> = {}
  for (const l of usedLeaves ?? []) {
    if (!usedMap[l.employee_id]) usedMap[l.employee_id] = { sl: 0, ul: 0 }
    if (l.leave_type === 'SL') usedMap[l.employee_id].sl += Number(l.days_count)
    if (l.leave_type === 'UL') usedMap[l.employee_id].ul += Number(l.days_count)
  }

  // Build rows
  const rows = employees.map(emp => {
    const bal = balanceMap[emp.id] ?? { sl_total: 18, ul_total: 6 }
    const used = usedMap[emp.id] ?? { sl: 0, ul: 0 }
    const slRemaining = Math.max(0, bal.sl_total - used.sl)
    const ulRemaining = Math.max(0, bal.ul_total - used.ul)
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      department: (emp.departments as unknown as { name: string } | null)?.name ?? '—',
      slTotal: bal.sl_total,
      slUsed: used.sl,
      slRemaining,
      ulTotal: bal.ul_total,
      ulUsed: used.ul,
      ulRemaining,
    }
  })

  const th: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid var(--border)',
    background: 'var(--surface2)',
  }

  const td: React.CSSProperties = {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: 'var(--text)',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  }

  const numCell = (val: number, warn?: boolean, dim?: boolean): React.CSSProperties => ({
    ...td,
    fontWeight: warn ? 700 : 500,
    color: warn ? 'var(--danger)' : dim ? 'var(--muted)' : 'var(--text)',
    textAlign: 'right' as const,
  })

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Team', href: '/team' }, { label: 'Leave Overview' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Leave Overview
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {year} leave balances for all active employees
        </p>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total employees', value: rows.length },
          { label: 'SL exhausted', value: rows.filter(r => r.slRemaining === 0).length },
          { label: 'UL exhausted', value: rows.filter(r => r.ulRemaining === 0).length },
        ].map(chip => (
          <div key={chip.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '0.625rem 1rem',
            display: 'flex', flexDirection: 'column', minWidth: '120px',
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{chip.label}</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Employee</th>
                <th style={th}>Department</th>
                <th style={{ ...th, textAlign: 'right' }}>SL Total</th>
                <th style={{ ...th, textAlign: 'right' }}>SL Used</th>
                <th style={{ ...th, textAlign: 'right', color: 'var(--primary)' }}>SL Left</th>
                <th style={{ ...th, textAlign: 'right' }}>UL Total</th>
                <th style={{ ...th, textAlign: 'right' }}>UL Used</th>
                <th style={{ ...th, textAlign: 'right', color: 'var(--warning)' }}>UL Left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const slLow = row.slRemaining <= 3
                const ulLow = row.ulRemaining <= 1
                const rowBg = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'
                return (
                  <tr key={row.id} style={{ background: rowBg }}>
                    <td style={td}>
                      <span style={{ fontWeight: 600 }}>{row.name}</span>
                      <span style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.68rem', fontWeight: 600,
                        background: row.role === 'super_admin' ? '#dbeafe'
                          : row.role === 'admin' ? '#eff6ff' : '#d1fae5',
                        color: row.role === 'super_admin' ? '#1e3a8a'
                          : row.role === 'admin' ? '#1d4ed8' : '#065f46',
                        borderRadius: '999px', padding: '0.05rem 0.45rem',
                      }}>
                        {row.role === 'super_admin' ? 'Super Admin'
                          : row.role === 'sub_super_admin' ? 'Sub Admin'
                          : row.role === 'admin' ? 'Admin' : 'Employee'}
                      </span>
                    </td>
                    <td style={{ ...td, color: 'var(--muted)' }}>{row.department}</td>
                    <td style={numCell(row.slTotal, false, true)}>{row.slTotal}</td>
                    <td style={numCell(row.slUsed, false, false)}>{row.slUsed}</td>
                    <td style={{
                      ...numCell(row.slRemaining, slLow, false),
                      background: slLow ? 'rgba(220,38,38,0.06)' : undefined,
                      fontWeight: 700,
                    }}>{row.slRemaining}</td>
                    <td style={numCell(row.ulTotal, false, true)}>{row.ulTotal}</td>
                    <td style={numCell(row.ulUsed, false, false)}>{row.ulUsed}</td>
                    <td style={{
                      ...numCell(row.ulRemaining, ulLow, false),
                      background: ulLow ? 'rgba(217,119,6,0.07)' : undefined,
                      fontWeight: 700,
                    }}>{row.ulRemaining}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.75rem', textAlign: 'right' }}>
        SL = Scheduled Leave · UL = Unscheduled / Sick Leave · Highlighted red = ≤3 SL remaining · Highlighted amber = ≤1 UL remaining
      </p>
    </div>
  )
}
