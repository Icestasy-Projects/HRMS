'use client'

import { useState, useRef } from 'react'

interface Props {
  label: string
  confirmTitle: string
  confirmMessage: string
  confirmLabel?: string
  style?: React.CSSProperties
  variant?: 'primary' | 'warning' | 'danger'
}

export default function ConfirmSubmitButton({
  label,
  confirmTitle,
  confirmMessage,
  confirmLabel,
  style,
  variant = 'primary',
}: Props) {
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const variantColor = variant === 'warning'
    ? 'var(--warning, #f59e0b)'
    : variant === 'danger'
      ? 'var(--danger, #dc2626)'
      : 'var(--primary)'

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    setConfirming(true)
  }

  function handleConfirm() {
    setConfirming(false)
    setSubmitting(true)
    const form = btnRef.current?.closest('form')
    if (form) form.requestSubmit()
  }

  return (
    <>
      {submitting && (
        <div style={{
          position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--primary)', color: '#fff',
          borderRadius: '0.75rem', padding: '0.75rem 1.5rem',
          fontWeight: 700, fontSize: '0.95rem', zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{
            width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff', borderRadius: '50%',
            display: 'inline-block', flexShrink: 0,
            animation: 'csb-spin 0.6s linear infinite',
          }} />
          Processing...
          <style>{`@keyframes csb-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

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
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', margin: '0 0 0.5rem' }}>
              {confirmTitle}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
              {confirmMessage}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
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
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.625rem',
                  border: 'none', background: variantColor,
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                {confirmLabel ?? 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        disabled={submitting}
        style={{
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
          ...style,
        }}
      >
        {submitting ? 'Processing...' : label}
      </button>
    </>
  )
}
