'use client'

import { useState } from 'react'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

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
          <ConfirmSubmitButton
            label="✓ Approve"
            confirmTitle="Approve Request"
            confirmMessage="Are you sure you want to approve this attendance regularization?"
            confirmLabel="Yes, Approve"
            style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}
          />
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <ConfirmSubmitButton
            label="✕ Reject"
            confirmTitle="Reject Request"
            confirmMessage="Are you sure you want to reject this attendance regularization?"
            confirmLabel="Yes, Reject"
            variant="danger"
            style={{ ...btnBase, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
          />
        </form>
      </div>
    </div>
  )
}
