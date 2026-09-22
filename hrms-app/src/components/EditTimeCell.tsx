'use client'

import { useState, useRef } from 'react'

interface Props {
  logDate: string
  userId: string
  checkIn: string | null
  checkOut: string | null
  updateAction: (formData: FormData) => Promise<void>
}

export default function EditTimeCell({ logDate, userId, checkIn, checkOut, updateAction }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function formatTime(t: string | null) {
    if (!t) return '—'
    const [h, m] = t.split(':')
    const hr = Number(h)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const hr12 = hr % 12 || 12
    return `${hr12}:${m} ${ampm}`
  }

  function toTimeInput(t: string | null) {
    if (!t) return ''
    return t.substring(0, 5)
  }

  async function handleSave() {
    const form = formRef.current
    if (!form) return
    setSaving(true)
    try {
      const formData = new FormData(form)
      await updateAction(formData)
    } catch {
      // redirect throws
    }
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        title="Edit times"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600,
          padding: '0.2rem 0.4rem', borderRadius: '0.375rem',
        }}
      >
        Edit
      </button>
    )
  }

  return (
    <form ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', minWidth: '180px' }}>
      <input type="hidden" name="work_date" value={logDate} />
      <input type="hidden" name="user_id" value={userId} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', width: '24px' }}>In</label>
        <input
          name="check_in"
          type="time"
          defaultValue={toTimeInput(checkIn)}
          style={{
            flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem',
            border: '1px solid var(--border)', borderRadius: '0.375rem',
            background: 'var(--surface2)', color: 'var(--text)', outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', width: '24px' }}>Out</label>
        <input
          name="check_out"
          type="time"
          defaultValue={toTimeInput(checkOut)}
          style={{
            flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem',
            border: '1px solid var(--border)', borderRadius: '0.375rem',
            background: 'var(--surface2)', color: 'var(--text)', outline: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: '0.3rem', fontSize: '0.72rem', fontWeight: 700,
            background: 'var(--primary)', color: '#fff', border: 'none',
            borderRadius: '0.375rem', cursor: 'pointer',
          }}
        >
          {saving ? '...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{
            flex: 1, padding: '0.3rem', fontSize: '0.72rem', fontWeight: 600,
            background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)',
            borderRadius: '0.375rem', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
