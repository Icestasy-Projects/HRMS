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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          background: 'var(--surface2)',
          color: 'var(--text)',
          fontSize: '0.825rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <form action={approveAction} style={{ flex: 1 }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <ConfirmSubmitButton
            label="Approve"
            confirmTitle="Approve Request"
            confirmMessage="Are you sure you want to approve this attendance regularization?"
            confirmLabel="Yes, Approve"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: 'none',
              background: 'var(--success)',
              color: '#fff',
              cursor: 'pointer',
              minHeight: '36px',
            }}
          />
        </form>
        <form action={rejectAction} style={{ flex: 1 }}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="admin_note" value={note} />
          <ConfirmSubmitButton
            label="Reject"
            confirmTitle="Reject Request"
            confirmMessage="Are you sure you want to reject this attendance regularization?"
            confirmLabel="Yes, Reject"
            variant="danger"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.8rem',
              background: 'transparent',
              color: 'var(--danger)',
              border: '1.5px solid var(--danger)',
              cursor: 'pointer',
              minHeight: '36px',
            }}
          />
        </form>
      </div>
    </div>
  )
}
