'use client'

import { useState } from 'react'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

interface ReimbursementItem {
  id: string
  expense_date: string
  category: string
  purpose: string
  amount: number
  status: string
  created_at: string
}

interface Batch {
  batchId: string
  items: ReimbursementItem[]
  total: number
  status: string
  createdAt: string
  employeeName?: string
}

interface SummaryStats {
  totalClaimed: number
  totalApproved: number
  totalPending: number
  totalRejected: number
  claimCount: number
}

interface Props {
  batches: Batch[]
  pendingBatches: Batch[]
  allBatches: Batch[]
  isAdmin: boolean
  categoryLabels: Record<string, string>
  myStats: SummaryStats
  allStats: SummaryStats | null
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; border: string }> = {
  pending: { bg: 'var(--warning-l, #fef3c7)', color: 'var(--warning, #d97706)', label: 'Pending', border: 'var(--warning, #d97706)' },
  approved: { bg: 'var(--success-l, #d1fae5)', color: 'var(--success, #059669)', label: 'Approved', border: 'var(--success, #059669)' },
  rejected: { bg: 'var(--danger-l, #fee2e2)', color: 'var(--danger, #dc2626)', label: 'Rejected', border: 'var(--danger, #dc2626)' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.04em', background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatINR(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatCard({ label, amount, count, color, gradient }: {
  label: string; amount: number; count?: number; color: string; gradient?: string
}) {
  return (
    <div style={{
      background: gradient || 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: '0.75rem',
      padding: '1rem 1.125rem', boxShadow: 'var(--shadow)',
      flex: '1 1 140px', minWidth: 0,
    }}>
      <p style={{
        color, fontSize: '0.68rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        margin: '0 0 0.5rem', whiteSpace: 'nowrap',
      }}>
        {label}
      </p>
      <p style={{ color, fontWeight: 800, fontSize: '1.5rem', margin: 0, lineHeight: 1.1 }}>
        {formatINR(amount)}
      </p>
      {count !== undefined && (
        <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '0.25rem 0 0' }}>
          {count} claim{count !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

function BatchCard({
  batchId, items, total, status, date, employeeName, categoryLabels, showActions, approveAction, rejectAction,
}: {
  batchId: string; items: ReimbursementItem[]; total: number; status: string; date: string
  employeeName?: string; categoryLabels: Record<string, string>; showActions: boolean
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const st = STATUS_STYLES[status] ?? STATUS_STYLES.pending

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${st.border}`,
      borderRadius: '0.75rem', overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '0.5rem',
          padding: '0.875rem 1.125rem', border: 'none', background: 'transparent',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {employeeName && (
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.15rem' }}>
              {employeeName}
            </p>
          )}
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
            {formatDate(date)} · {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
            {formatINR(total)}
          </span>
          <StatusBadge status={status} />
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.125rem 1.125rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr>
                  {['Date', 'Category', 'Purpose', 'Amount'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Amount' ? 'right' : 'left',
                      padding: '0.5rem 0.5rem', fontWeight: 600,
                      color: 'var(--muted)', fontSize: '0.68rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '0.5rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {formatDate(item.expense_date)}
                    </td>
                    <td style={{ padding: '0.5rem', color: 'var(--text)' }}>
                      <span style={{
                        display: 'inline-block', padding: '0.15rem 0.5rem',
                        borderRadius: '0.375rem', background: 'var(--bg)',
                        fontSize: '0.78rem', fontWeight: 500,
                      }}>
                        {categoryLabels[item.category] ?? item.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', color: 'var(--text)' }}>
                      {item.purpose}
                    </td>
                    <td style={{ padding: '0.5rem', color: 'var(--text)', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatINR(Number(item.amount))}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{
                    padding: '0.625rem 0.5rem', fontWeight: 700, color: 'var(--text)',
                    borderTop: '2px solid var(--border)', textAlign: 'right',
                  }}>
                    Total
                  </td>
                  <td style={{
                    padding: '0.625rem 0.5rem', fontWeight: 800, color: 'var(--primary)',
                    borderTop: '2px solid var(--border)', textAlign: 'right', whiteSpace: 'nowrap',
                  }}>
                    {formatINR(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {showActions && status === 'pending' && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <form action={approveAction} style={{ flex: 1 }}>
                <input type="hidden" name="batch_id" value={batchId} />
                <ConfirmSubmitButton
                  label="Approve"
                  confirmTitle="Approve Reimbursement"
                  confirmMessage={`Approve this claim of INR ${formatINR(total)}?`}
                  confirmLabel="Yes, Approve"
                  variant="primary"
                  style={{
                    width: '100%', padding: '0.625rem', borderRadius: '0.5rem',
                    border: 'none', background: 'var(--success, #059669)',
                    color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', minHeight: '40px',
                  }}
                />
              </form>
              <form action={rejectAction} style={{ flex: 1 }}>
                <input type="hidden" name="batch_id" value={batchId} />
                <ConfirmSubmitButton
                  label="Reject"
                  confirmTitle="Reject Reimbursement"
                  confirmMessage={`Reject this claim of INR ${formatINR(total)}?`}
                  confirmLabel="Yes, Reject"
                  variant="danger"
                  style={{
                    width: '100%', padding: '0.625rem', borderRadius: '0.5rem',
                    border: '1px solid var(--danger)', background: 'transparent',
                    color: 'var(--danger)', fontWeight: 700, fontSize: '0.85rem',
                    cursor: 'pointer', minHeight: '40px',
                  }}
                />
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center',
    }}>
      <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>{icon}</p>
      <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>{title}</p>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>{subtitle}</p>
    </div>
  )
}

function BatchList({ batches, categoryLabels, showActions, showName, approveAction, rejectAction }: {
  batches: Batch[]; categoryLabels: Record<string, string>; showActions: boolean; showName: boolean
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {batches.map(b => (
        <BatchCard
          key={b.batchId}
          batchId={b.batchId}
          items={b.items}
          total={b.total}
          status={b.status}
          date={b.createdAt}
          employeeName={showName ? b.employeeName : undefined}
          categoryLabels={categoryLabels}
          showActions={showActions}
          approveAction={approveAction}
          rejectAction={rejectAction}
        />
      ))}
    </div>
  )
}

type TabKey = 'my' | 'review' | 'all'

export default function ReimbursementList({
  batches, pendingBatches, allBatches, isAdmin, categoryLabels,
  myStats, allStats, approveAction, rejectAction,
}: Props) {
  const defaultTab: TabKey = isAdmin && pendingBatches.length > 0 ? 'review' : 'my'
  const [tab, setTab] = useState<TabKey>(defaultTab)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredAll = statusFilter === 'all'
    ? allBatches
    : allBatches.filter(b => b.status === statusFilter)

  const stats = tab === 'all' && allStats ? allStats : myStats

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'my', label: 'My Claims' },
  ]
  if (isAdmin) {
    tabs.push({ key: 'review', label: 'Review', badge: pendingBatches.length || undefined })
    tabs.push({ key: 'all', label: 'All Claims' })
  }

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <StatCard
          label="Total Claimed"
          amount={stats.totalClaimed}
          count={stats.claimCount}
          color="var(--primary)"
          gradient="linear-gradient(135deg, var(--primary-l), var(--surface))"
        />
        <StatCard label="Approved" amount={stats.totalApproved} color="var(--success, #059669)" />
        <StatCard label="Pending" amount={stats.totalPending} color="var(--warning, #d97706)" />
        <StatCard label="Rejected" amount={stats.totalRejected} color="var(--danger, #dc2626)" />
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
        background: 'var(--surface2, var(--bg))', borderRadius: '0.625rem',
        padding: '0.25rem', border: '1px solid var(--border)',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '0.625rem 0.5rem', borderRadius: '0.5rem',
              border: 'none', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', minHeight: '40px',
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? 'var(--primary)' : 'var(--muted)',
              boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            {t.badge && t.badge > 0 && (
              <span style={{
                background: tab === t.key ? 'var(--warning, #d97706)' : 'var(--border)',
                color: tab === t.key ? '#fff' : 'var(--muted)',
                fontSize: '0.68rem', fontWeight: 700, borderRadius: '999px',
                padding: '0 0.4rem', minWidth: '18px', height: '18px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My Claims */}
      {tab === 'my' && (
        batches.length === 0
          ? <EmptyState icon="📋" title="No reimbursement claims" subtitle="Submit a new claim to get started." />
          : <BatchList batches={batches} categoryLabels={categoryLabels} showActions={false} showName={false} approveAction={approveAction} rejectAction={rejectAction} />
      )}

      {/* Review Tab */}
      {tab === 'review' && isAdmin && (
        pendingBatches.length === 0
          ? <EmptyState icon="✅" title="All caught up" subtitle="No pending reimbursements to review." />
          : <BatchList batches={pendingBatches} categoryLabels={categoryLabels} showActions={true} showName={true} approveAction={approveAction} rejectAction={rejectAction} />
      )}

      {/* All Claims Tab */}
      {tab === 'all' && isAdmin && (
        <div>
          {/* Status filter + Export */}
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map(f => (

              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '999px',
                  border: statusFilter === f.key ? 'none' : '1px solid var(--border)',
                  background: statusFilter === f.key ? 'var(--primary)' : 'var(--surface)',
                  color: statusFilter === f.key ? '#fff' : 'var(--text)',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  minHeight: '32px',
                }}
              >
                {f.label}
                {f.key !== 'all' && (() => {
                  const count = allBatches.filter(b => b.status === f.key).length
                  return count > 0 ? ` (${count})` : ''
                })()}
              </button>
            ))}
          </div>

          {/* Export button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <a
              href="/api/reimbursement/export"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600,
                textDecoration: 'none', cursor: 'pointer',
                boxShadow: 'var(--shadow)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Excel
            </a>
          </div>

          {filteredAll.length === 0
            ? <EmptyState icon="📂" title="No claims found" subtitle={statusFilter === 'all' ? 'No reimbursement claims submitted yet.' : `No ${statusFilter} claims.`} />
            : <BatchList batches={filteredAll} categoryLabels={categoryLabels} showActions={statusFilter === 'pending'} showName={true} approveAction={approveAction} rejectAction={rejectAction} />
          }
        </div>
      )}
    </div>
  )
}
