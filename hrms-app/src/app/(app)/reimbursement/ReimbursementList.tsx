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
}

interface PendingBatch {
  batchId: string
  items: ReimbursementItem[]
  total: number
  employeeName: string
  createdAt: string
}

interface Props {
  batches: Batch[]
  pendingBatches: PendingBatch[]
  isAdmin: boolean
  categoryLabels: Record<string, string>
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'var(--warning-l, #fef3c7)', color: 'var(--warning, #d97706)', label: 'Pending' },
  approved: { bg: 'var(--success-l, #d1fae5)', color: 'var(--success, #059669)', label: 'Approved' },
  rejected: { bg: 'var(--danger-l, #fee2e2)', color: 'var(--danger, #dc2626)', label: 'Rejected' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
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

function BatchCard({
  batchId, items, total, status, date, employeeName, categoryLabels, showActions, approveAction, rejectAction,
}: {
  batchId: string
  items: ReimbursementItem[]
  total: number
  status: string
  date: string
  employeeName?: string
  categoryLabels: Record<string, string>
  showActions: boolean
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '0.75rem',
          padding: '1rem 1.25rem', border: 'none', background: 'transparent',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {employeeName && (
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.2rem' }}>
              {employeeName}
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
            {formatDate(date)} &middot; {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
            INR {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <StatusBadge status={status} />
          <span style={{
            transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--muted)', fontSize: '1rem',
          }}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1.25rem 1.25rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {['Date', 'Category', 'Purpose', 'Amount'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Amount' ? 'right' : 'left',
                      padding: '0.5rem 0.625rem', fontWeight: 600,
                      color: 'var(--muted)', fontSize: '0.72rem',
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
                    <td style={{ padding: '0.5rem 0.625rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                      {formatDate(item.expense_date)}
                    </td>
                    <td style={{ padding: '0.5rem 0.625rem', color: 'var(--text)' }}>
                      {categoryLabels[item.category] ?? item.category}
                    </td>
                    <td style={{ padding: '0.5rem 0.625rem', color: 'var(--text)' }}>
                      {item.purpose}
                    </td>
                    <td style={{ padding: '0.5rem 0.625rem', color: 'var(--text)', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{
                    padding: '0.625rem', fontWeight: 700, color: 'var(--text)',
                    borderTop: '2px solid var(--border)', textAlign: 'right',
                  }}>
                    Total
                  </td>
                  <td style={{
                    padding: '0.625rem', fontWeight: 800, color: 'var(--primary)',
                    borderTop: '2px solid var(--border)', textAlign: 'right', whiteSpace: 'nowrap',
                  }}>
                    INR {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  confirmMessage={`Approve this claim of INR ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}?`}
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
                  confirmMessage={`Reject this claim of INR ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}?`}
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

export default function ReimbursementList({
  batches, pendingBatches, isAdmin, categoryLabels, approveAction, rejectAction,
}: Props) {
  const [tab, setTab] = useState<'my' | 'review'>(pendingBatches.length > 0 ? 'review' : 'my')

  return (
    <div>
      {/* Tabs */}
      {isAdmin && (
        <div style={{
          display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
          background: 'var(--surface2)', borderRadius: '0.625rem',
          padding: '0.25rem', border: '1px solid var(--border)',
        }}>
          {([
            { key: 'my' as const, label: 'My Claims' },
            { key: 'review' as const, label: `Review${pendingBatches.length > 0 ? ` (${pendingBatches.length})` : ''}` },
          ]).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.5rem',
                border: 'none', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', minHeight: '40px',
                background: tab === t.key ? 'var(--surface)' : 'transparent',
                color: tab === t.key ? 'var(--primary)' : 'var(--muted)',
                boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* My Claims */}
      {tab === 'my' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {batches.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center',
            }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📋</p>
              <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No reimbursement claims</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>Submit a new claim to get started.</p>
            </div>
          ) : (
            batches.map(b => (
              <BatchCard
                key={b.batchId}
                batchId={b.batchId}
                items={b.items}
                total={b.total}
                status={b.status}
                date={b.createdAt}
                categoryLabels={categoryLabels}
                showActions={false}
                approveAction={approveAction}
                rejectAction={rejectAction}
              />
            ))
          )}
        </div>
      )}

      {/* Review Tab */}
      {tab === 'review' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pendingBatches.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center',
            }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>✅</p>
              <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>All caught up</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No pending reimbursements to review.</p>
            </div>
          ) : (
            pendingBatches.map(b => (
              <BatchCard
                key={b.batchId}
                batchId={b.batchId}
                items={b.items}
                total={b.total}
                status="pending"
                date={b.createdAt}
                employeeName={b.employeeName}
                categoryLabels={categoryLabels}
                showActions={true}
                approveAction={approveAction}
                rejectAction={rejectAction}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
