'use client'

import { useState } from 'react'

interface Props {
  isDone: boolean
  isClockedIn: boolean
  action: () => Promise<void>
}

export default function ClockButton({ isDone, isClockedIn, action }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const label = isDone ? 'Day Complete' : isClockedIn ? 'Clock Out' : 'Clock In'
  const icon = isDone ? '✓' : isClockedIn ? '◉' : '◎'
  const bg = isDone ? 'var(--success)' : isClockedIn ? '#dc2626' : 'var(--primary)'
  const confirmMsg = isClockedIn
    ? 'Are you sure you want to clock out now?'
    : 'Are you sure you want to clock in now?'
  const successMsg = isClockedIn ? 'Clocked out successfully!' : 'Clocked in successfully!'

  async function handleConfirm() {
    setLoading(true)
    setConfirming(false)
    await action()
    setLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  return (
    <>
      {/* Success toast */}
      {success && (
        <div style={{
          position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--success)', color: '#fff',
          borderRadius: '0.75rem', padding: '0.75rem 1.5rem',
          fontWeight: 700, fontSize: '0.95rem', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Confirmation modal */}
      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '1rem', padding: '2rem 1.75rem',
            maxWidth: '360px', width: '90%', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <p style={{ fontSize: '1.75rem', margin: '0 0 0.75rem' }}>
              {isClockedIn ? '🕐' : '🟢'}
            </p>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Confirm {label}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
              {confirmMsg}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.625rem',
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.625rem',
                  border: 'none', background: bg,
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Yes, {isClockedIn ? 'Clock Out' : 'Clock In'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={isDone || loading}
        onClick={() => !isDone && setConfirming(true)}
        style={{
          width: '100%', height: '80px',
          background: loading ? 'var(--muted)' : bg,
          color: '#fff',
          border: 'none', borderRadius: '1rem',
          fontSize: '1.375rem', fontWeight: 800,
          cursor: isDone || loading ? 'default' : 'pointer',
          boxShadow: isDone ? 'none' : '0 4px 20px rgba(124,47,201,0.35)',
          letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
          transition: 'opacity 0.15s',
        }}
      >
        <span style={{ fontSize: isDone ? '1.25rem' : '1.5rem' }}>{loading ? '…' : icon}</span>
        {loading ? 'Processing…' : label}
      </button>
    </>
  )
}
