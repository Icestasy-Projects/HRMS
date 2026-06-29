'use client'

import { useState } from 'react'

interface LeaveRequestFormProps {
  scheduledBalance: number
  unscheduledBalance: number
  onSubmit: (formData: FormData) => Promise<void>
}

export default function LeaveRequestForm({ scheduledBalance, unscheduledBalance, onSubmit }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<'scheduled' | 'unscheduled'>('scheduled')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isHalfDay, setIsHalfDay] = useState(false)

  function calcDays() {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) return 0
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    if (isHalfDay) return leaveType === 'unscheduled' ? 0.75 : 0.5
    return diff
  }

  const days = calcDays()
  const balance = leaveType === 'scheduled' ? scheduledBalance : unscheduledBalance
  const remaining = balance - days

  return (
    <form action={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <input type="hidden" name="leave_type" value={leaveType} />

      {/* Type toggle */}
      <div>
        <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          Leave Type
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['scheduled', 'unscheduled'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setLeaveType(t)}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: `1px solid ${leaveType === t ? 'var(--primary)' : 'var(--border)'}`,
                background: leaveType === t ? 'rgba(139,47,201,0.2)' : 'var(--surface2)',
                color: leaveType === t ? 'var(--primary-h)' : 'var(--muted)',
                cursor: 'pointer',
                fontWeight: leaveType === t ? 600 : 400,
                textTransform: 'capitalize',
                minHeight: '44px',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
          Balance: {balance} day{balance !== 1 ? 's' : ''}
          {leaveType === 'unscheduled' && ' · Auto-approved'}
        </p>
      </div>

      {/* Date range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
            Start Date
          </label>
          <input
            name="start_date"
            type="date"
            required
            value={startDate}
            onChange={e => { setStartDate(e.target.value); if (!endDate) setEndDate(e.target.value) }}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
            End Date
          </label>
          <input
            name="end_date"
            type="date"
            required
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            min={startDate}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Half day */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          color: 'var(--text)',
          fontSize: '0.9rem',
        }}
      >
        <input
          name="is_half_day"
          type="checkbox"
          checked={isHalfDay}
          onChange={e => setIsHalfDay(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
        />
        Half day only
      </label>

      {/* Reason */}
      <div>
        <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
          Reason
        </label>
        <textarea
          name="reason"
          rows={3}
          style={{
            width: '100%',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            color: 'var(--text)',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Preview */}
      {days > 0 && (
        <div
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.875rem 1rem',
            fontSize: '0.875rem',
          }}
        >
          <p style={{ color: 'var(--text)', margin: '0 0 0.25rem' }}>
            Deducting <strong>{days}</strong> day{days !== 1 ? 's' : ''} from {leaveType} leave
          </p>
          <p style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
            Remaining after: <strong>{remaining}</strong> day{remaining !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <button
        type="submit"
        style={{
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.75rem',
          padding: '0.875rem',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        {leaveType === 'unscheduled' ? 'Submit (Auto-approved)' : 'Submit Request'}
      </button>
    </form>
  )
}
