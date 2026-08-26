'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

function SubmitBtn({ label, pendingLabel, style }: {
  label: string; pendingLabel: string; style: React.CSSProperties
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} style={{
      ...style, opacity: pending ? 0.65 : 1, cursor: pending ? 'not-allowed' : 'pointer',
    }}>
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function RegularizationActions({
  id,
  approveAction,
  rejectAction,
}: {
  id: string
  approveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}) {
  const [note, setNote] = useState('')

  const btnBase: React.CSSProperties = {
    padding: '0.35rem 0.625rem',
    borderRadius: '0.375rem',
    fontWeight: 700,
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    border: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        style={{
          width: '100%', padding: '0.3rem 0.5rem',
          border: '1px solid var(--border)', borderRadius: '0.375rem',
          background: 'var(--surface2)', color: 'var(--text)',
          fontSize: '0.75rem', outline: 'none', boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <form action={approveAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <SubmitBtn
            label="✓ Approve"
            pendingLabel="…"
            style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}
          />
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <SubmitBtn
            label="✕ Reject"
            pendingLabel="…"
            style={{ ...btnBase, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
          />
        </form>
      </div>
    </div>
  )
}
