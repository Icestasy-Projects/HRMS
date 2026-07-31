'use client'

import { useRef, useState } from 'react'

interface Props {
  submitSeparation: (formData: FormData) => Promise<void>
  withdrawRequest: (formData: FormData) => Promise<void>
  existing: {
    id: string
    type: string
    reason?: string | null
    status: string
    sabbatical_from?: string | null
    sabbatical_to?: string | null
    notice_period_days?: number | null
  } | null
  todayStr: string
}

const statusColor: Record<string, string> = {
  pending: 'var(--warning)',
  approved: 'var(--success)',
  rejected: 'var(--danger)',
}
const statusBg: Record<string, string> = {
  pending: 'var(--warning-l)',
  approved: 'var(--success-l)',
  rejected: 'var(--danger-l)',
}

export default function SeparationForm({ submitSeparation, withdrawRequest, existing, todayStr }: Props) {
  const [type, setType] = useState<'resignation' | 'sabbatical' | null>(null)

  return (
    <>
      {/* Existing request */}
      {existing && (
        <div style={{
          background: statusBg[existing.status] ?? 'var(--surface)',
          border: `1px solid ${statusColor[existing.status] ?? 'var(--border)'}`,
          borderRadius: '0.875rem', padding: '1.25rem',
          marginBottom: '1.5rem', boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', margin: 0, textTransform: 'capitalize' }}>
                {existing.type === 'resignation' ? 'Resignation' : 'Sabbatical Leave'}
              </p>
              {existing.type === 'sabbatical' && existing.sabbatical_from && (
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
                  {existing.sabbatical_from} → {existing.sabbatical_to}
                </p>
              )}
              {existing.reason && (
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                  &ldquo;{existing.reason}&rdquo;
                </p>
              )}
              {existing.status === 'approved' && existing.notice_period_days && (
                <p style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, margin: '0.375rem 0 0' }}>
                  Notice period: {existing.notice_period_days} days
                </p>
              )}
            </div>
            <span style={{
              background: statusColor[existing.status], color: '#fff',
              borderRadius: '999px', padding: '0.25rem 0.875rem',
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap',
            }}>
              {existing.status}
            </span>
          </div>
          {existing.status === 'pending' && (
            <form action={withdrawRequest} style={{ marginTop: '1rem' }}>
              <input type="hidden" name="id" value={existing.id} />
              <button type="submit" style={{
                background: 'transparent', border: '1px solid var(--danger)',
                color: 'var(--danger)', borderRadius: '0.5rem', padding: '0.5rem 1rem',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Withdraw Request
              </button>
            </form>
          )}
        </div>
      )}

      {/* New request form — only if no pending/approved */}
      {(!existing || existing.status === 'rejected') && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.875rem', padding: '1.5rem', boxShadow: 'var(--shadow)',
        }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', margin: '0 0 1.25rem' }}>
            New Request
          </p>
          <form action={submitSeparation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Type
              </label>
              <input type="hidden" name="type" value={type ?? ''} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {(['resignation', 'sabbatical'] as const).map(t => (
                  <div
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      border: `2px solid ${type === t ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '0.75rem', padding: '1rem',
                      textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                  >
                    <p style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{t === 'resignation' ? '🚪' : '🏖'}</p>
                    <p style={{ fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.875rem', textTransform: 'capitalize' }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sabbatical dates — shown only when sabbatical selected */}
            {type === 'sabbatical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>From</label>
                    <input type="date" name="sabbatical_from" min={todayStr} required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>To</label>
                    <input type="date" name="sabbatical_to" min={todayStr} required
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Reason (optional)
              </label>
              <textarea name="reason" rows={3} placeholder="Add a note for HR..."
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button
              type="submit"
              disabled={!type}
              style={{
                background: type ? 'var(--primary)' : 'var(--muted)', color: '#fff', border: 'none',
                borderRadius: '0.75rem', padding: '0.875rem', fontWeight: 700,
                fontSize: '0.95rem', cursor: type ? 'pointer' : 'not-allowed', opacity: type ? 1 : 0.6,
              }}
            >
              Submit Request
            </button>
          </form>
        </div>
      )}
    </>
  )
}
