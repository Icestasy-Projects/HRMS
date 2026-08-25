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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem',
    border: '1px solid var(--border)', borderRadius: '0.5rem',
    background: 'var(--surface2)', color: 'var(--text)',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        style={inputStyle}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.625rem' }}>
        <form action={approveAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <SubmitBtn
            label="✓ Approve & Update Attendance"
            pendingLabel="Approving…"
            style={{
              width: '100%',
              background: 'var(--success)', color: '#fff',
              border: 'none', borderRadius: '0.5rem',
              padding: '0.625rem', fontWeight: 700, fontSize: '0.875rem',
            }}
          />
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <SubmitBtn
            label="✕ Reject"
            pendingLabel="Rejecting…"
            style={{
              width: '100%',
              background: 'transparent', color: 'var(--danger)',
              border: '1px solid var(--danger)', borderRadius: '0.5rem',
              padding: '0.625rem', fontWeight: 700, fontSize: '0.875rem',
            }}
          />
        </form>
      </div>
    </div>
  )
}
