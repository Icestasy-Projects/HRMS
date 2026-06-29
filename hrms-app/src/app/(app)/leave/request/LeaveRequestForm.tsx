'use client'

import { useState } from 'react'

interface LeaveRequestFormProps {
  scheduledBalance: number
  unscheduledBalance: number
  onSubmit: (formData: FormData) => Promise<void>
}

export default function LeaveRequestForm({ scheduledBalance, unscheduledBalance, onSubmit }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<'SL' | 'UL'>('SL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isHalfDay, setIsHalfDay] = useState(false)

  const sameDay = !!startDate && startDate === endDate
  const halfDayDisabled = !sameDay

  function calcDays() {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) return 0
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    if (isHalfDay && sameDay) return leaveType === 'UL' ? 0.75 : 0.5
    return diff
  }

  const days = calcDays()
  const balance = leaveType === 'SL' ? scheduledBalance : unscheduledBalance
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
          {([['SL', 'Scheduled'], ['UL', 'Unscheduled']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => { setLeaveType(val); setIsHalfDay(false) }}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: `1px solid ${leaveType === val ? 'var(--primary)' : 'var(--border)'}`,
                background: leaveType === val ? 'rgba(139,47,201,0.2)' : 'var(--surface2)',
                color: leaveType === val ? 'var(--primary-h)' : 'var(--muted)',
                cursor: 'pointer',
                fontWeight: leaveType === val ? 600 : 400,
                minHeight: '44px',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
          Balance: {balance} day{balance !== 1 ? 's' : ''}
          {leaveType === 'UL' && ' · Auto-approved'}
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
            onChange={e => {
              setStartDate(e.target.value)
              if (!endDate) setEndDate(e.target.value)
              setIsHalfDay(false)
            }}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--text)',
              outline: 'none',
              boxSizing: 'border-box',
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
            onChange={e => { setEndDate(e.target.value); setIsHalfDay(false) }}
            min={startDate}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--text)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Half day — only enabled when start === end */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: halfDayDisabled ? 'not-allowed' : 'pointer',
          color: halfDayDisabled ? 'var(--muted)' : 'var(--text)',
          fontSize: '0.9rem',
          opacity: halfDayDisabled ? 0.5 : 1,
        }}
      >
        <input
          name="is_half_day"
          type="checkbox"
          checked={isHalfDay && sameDay}
          disabled={halfDayDisabled}
          onChange={e => setIsHalfDay(e.target.checked)}
          style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
        />
        Half day only
        {halfDayDisabled && startDate && endDate && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>(same day only)</span>
        )}
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
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Preview */}
      {days > 0 && (
        <div style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem',
          fontSize: '0.875rem',
        }}>
          <p style={{ color: 'var(--text)', margin: '0 0 0.25rem' }}>
            Deducting <strong>{days}</strong> day{days !== 1 ? 's' : ''} from {leaveType === 'SL' ? 'scheduled' : 'unscheduled'} leave
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
        {leaveType === 'UL' ? 'Submit (Auto-approved)' : 'Submit Request'}
      </button>
    </form>
  )
}
