'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.75rem 1rem',
  border: '1px solid var(--border)', borderRadius: '0.625rem',
  background: 'var(--surface2)', color: 'var(--text)',
  fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        background: 'var(--primary)', color: '#fff',
        border: 'none', borderRadius: '0.625rem',
        padding: '0.875rem', fontWeight: 700, fontSize: '0.95rem',
        cursor: pending ? 'not-allowed' : 'pointer', minHeight: '44px',
        opacity: pending ? 0.7 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        width: '100%',
      }}
    >
      {pending ? 'Submitting…' : 'Submit Request'}
    </button>
  )
}

export default function RegularizationForm({
  today,
  submitAction,
}: {
  today: string
  submitAction: (formData: FormData) => Promise<void>
}) {
  const [field, setField] = useState('check_in')

  return (
    <form action={submitAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input type="date" name="work_date" required max={today} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Correction For</label>
          <select
            name="field"
            required
            value={field}
            onChange={(e) => setField(e.target.value)}
            style={inputStyle}
          >
            <option value="check_in">Check-In Time</option>
            <option value="check_out">Check-Out Time</option>
            <option value="both">Check-In &amp; Check-Out</option>
          </select>
        </div>
      </div>

      {(field === 'check_in' || field === 'both') && (
        <div>
          <label style={labelStyle}>
            {field === 'both' ? 'Correct Check-In Time (HH:MM)' : 'Correct Time (HH:MM)'}
          </label>
          <input type="time" name="requested_value_checkin" required style={inputStyle} />
        </div>
      )}

      {(field === 'check_out' || field === 'both') && (
        <div>
          <label style={labelStyle}>
            {field === 'both' ? 'Correct Check-Out Time (HH:MM)' : 'Correct Time (HH:MM)'}
          </label>
          <input type="time" name="requested_value_checkout" required style={inputStyle} />
        </div>
      )}

      <div>
        <label style={labelStyle}>Reason / Explanation</label>
        <textarea
          name="reason"
          required
          rows={3}
          placeholder="Explain why the time needs to be corrected..."
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <SubmitButton />
    </form>
  )
}
