import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function roleLabel(r: string) {
  return r === 'super_admin' ? 'Super Admin' : r === 'sub_super_admin' ? 'Sub Super Admin' : r === 'admin' ? 'Admin' : 'Employee'
}
function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!me || !['super_admin', 'sub_super_admin'].includes(me.role)) redirect('/dashboard')

  const { data: emp } = await admin.from('users')
    .select('*, departments(name)')
    .eq('id', id).single()
  if (!emp) redirect('/manage/employees')

  // Manager info
  const { data: manager } = emp.manager_id
    ? await admin.from('users').select('id, name, role').eq('id', emp.manager_id).single()
    : { data: null }

  // Direct reports
  const { data: reports } = await admin.from('users')
    .select('id, name, role, departments(name)')
    .eq('manager_id', id)
    .eq('is_active', true)
    .order('name')

  // Salary history
  const { data: salaryHistory } = await admin.from('salary_adjustments')
    .select('*')
    .eq('user_id', id)
    .order('effective_date', { ascending: false })

  // Leave balance
  const year = new Date().getFullYear()
  const { data: leaveBalance } = await admin.from('leave_balances')
    .select('*').eq('user_id', id).eq('year', year).single()

  // Approved leaves this year
  const { data: approvedLeaves } = await admin.from('leave_requests')
    .select('leave_type, days_count')
    .eq('employee_id', id).eq('status', 'approved')
    .gte('start_date', `${year}-01-01`).lte('start_date', `${year}-12-31`)
  const slUsed = approvedLeaves?.filter(r => r.leave_type === 'SL').reduce((s, r) => s + Number(r.days_count), 0) ?? 0
  const ulUsed = approvedLeaves?.filter(r => r.leave_type === 'UL').reduce((s, r) => s + Number(r.days_count), 0) ?? 0

  const ROLE_COLOR: Record<string, string> = {
    super_admin: '#6d28d9', sub_super_admin: '#9d174d', admin: '#1e40af', employee: '#065f46',
  }
  const rc = ROLE_COLOR[emp.role] ?? '#6b7280'

  const section = (title: string) => (
    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 0.875rem' }}>
      {title}
    </p>
  )
  const row = (label: string, value: string | null | undefined) => value ? (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  ) : null

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Manage', href: '/manage' },
          { label: 'Employees', href: '/manage/employees' },
          { label: emp.name },
        ]} />
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-l), var(--surface))',
        border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
        marginBottom: '1.5rem', boxShadow: 'var(--shadow)',
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
          background: `${rc}22`, border: `3px solid ${rc}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: rc, fontWeight: 800, fontSize: '22px',
        }}>
          {initials(emp.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{emp.name}</h1>
          <p style={{ color: 'var(--muted)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{emp.email}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ background: `${rc}18`, color: rc, border: `1px solid ${rc}44`, borderRadius: '999px', padding: '0.15rem 0.625rem', fontSize: '0.72rem', fontWeight: 700 }}>
              {roleLabel(emp.role)}
            </span>
            {emp.departments && (
              <span style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.15rem 0.625rem', fontSize: '0.72rem', fontWeight: 600 }}>
                {(emp.departments as { name: string }).name}
              </span>
            )}
            <span style={{ background: emp.is_active ? '#d1fae5' : '#fee2e2', color: emp.is_active ? '#065f46' : '#991b1b', borderRadius: '999px', padding: '0.15rem 0.625rem', fontSize: '0.72rem', fontWeight: 600 }}>
              {emp.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <Link href={`/manage/employees/${id}`} style={{
          background: 'var(--primary)', color: '#fff', borderRadius: '0.625rem',
          padding: '0.625rem 1.125rem', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
          whiteSpace: 'nowrap', alignSelf: 'flex-start',
        }}>
          Edit
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        {/* Personal Info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
          {section('Personal Information')}
          {row('Phone', emp.phone)}
          {row('Employee Type', emp.employee_type?.replace('_', ' '))}
          {row('Role', roleLabel(emp.role))}
          {row('Department', (emp.departments as { name: string } | null)?.name)}
          {row('Status', emp.is_active ? 'Active' : 'Inactive')}
          {row('Must Change Password', emp.must_change_password ? 'Yes' : 'No')}
        </div>

        {/* Org Position */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
          {section('Organisation Position')}
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.375rem' }}>Reports To</p>
            {manager ? (
              <Link href={`/manage/employees/${manager.id}/view`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', background: 'var(--surface2)', borderRadius: '0.625rem', padding: '0.625rem 0.875rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-l)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>
                    {initials(manager.name)}
                  </div>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>{manager.name}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: 0 }}>{roleLabel(manager.role)}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Top of hierarchy — no manager</p>
            )}
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>
            Direct Reports ({reports?.length ?? 0})
          </p>
          {reports && reports.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {reports.map(r => (
                <Link key={r.id} href={`/manage/employees/${r.id}/view`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', background: 'var(--surface2)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-l)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '10px', flexShrink: 0 }}>
                      {initials(r.name)}
                    </div>
                    <div>
                      <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.82rem' }}>{r.name}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>{roleLabel(r.role)}{r.departments ? ` · ${(r.departments as { name: string }).name}` : ''}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No direct reports</p>
          )}
        </div>

        {/* Leave Balance */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
          {section(`Leave Balance — ${year}`)}
          {leaveBalance ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Scheduled', used: slUsed, total: leaveBalance.sl_total },
                { label: 'Unscheduled', used: ulUsed, total: leaveBalance.ul_total },
              ].map(b => (
                <div key={b.label} style={{ background: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.875rem' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{b.label}</p>
                  <p style={{ color: 'var(--text)', fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>{b.total - b.used}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>of {b.total} ({b.used} used)</p>
                  <div style={{ background: 'var(--border)', borderRadius: '999px', height: '4px', marginTop: '0.5rem' }}>
                    <div style={{ background: 'var(--primary)', borderRadius: '999px', height: '4px', width: `${Math.min(100, (b.used / b.total) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No leave balance record for {year}</p>
          )}
        </div>

        {/* Compensation History */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
          {section('Compensation History')}
          {salaryHistory && salaryHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {salaryHistory.map((s: Record<string, unknown>, idx: number) => (
                <div key={String(s.id)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '0.625rem 0', borderBottom: idx < salaryHistory.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: '0.5rem',
                }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0, fontSize: '0.875rem' }}>
                      ₹{Number(s.amount).toLocaleString('en-IN')}
                    </p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: '0.1rem 0 0' }}>
                      {String(s.reason ?? s.notes ?? 'Salary adjustment')}
                    </p>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: '0.75rem', margin: 0, whiteSpace: 'nowrap' }}>
                    {formatDate(String(s.effective_date ?? s.created_at))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No compensation records yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
