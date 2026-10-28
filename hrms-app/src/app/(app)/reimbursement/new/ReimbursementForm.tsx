'use client'

import { useState } from 'react'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'communication', label: 'Communication' },
  { value: 'training', label: 'Training' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
]

interface Entry {
  id: string
  date: string
  category: string
  purpose: string
  amount: string
}

function emptyEntry(): Entry {
  return { id: crypto.randomUUID(), date: '', category: '', purpose: '', amount: '' }
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: 'var(--muted)', marginBottom: '0.35rem',
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text)', fontSize: '0.9rem', minHeight: '44px',
  outline: 'none',
}

export default function ReimbursementForm({ onSubmit }: { onSubmit: (formData: FormData) => Promise<void> }) {
  const [entries, setEntries] = useState<Entry[]>([emptyEntry()])

  function addEntry() {
    setEntries(prev => [...prev, emptyEntry()])
  }

  function removeEntry(id: string) {
    setEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev)
  }

  function updateEntry(id: string, field: keyof Entry, value: string) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const total = entries.reduce((sum, e) => {
    const v = parseFloat(e.amount)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)

  const allValid = entries.every(e => e.date && e.category && e.purpose.trim() && parseFloat(e.amount) > 0)

  return (
    <form action={onSubmit}>
      <input type="hidden" name="entries_json" value={JSON.stringify(entries.map(e => ({
        date: e.date, category: e.category, purpose: e.purpose, amount: e.amount,
      })))} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {entries.map((entry, idx) => (
          <div key={entry.id} style={{
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.25rem',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Item {idx + 1}
              </span>
              {entries.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600,
                    padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={{
              display: 'grid', gap: '0.875rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  required
                  value={entry.date}
                  onChange={e => updateEntry(entry.id, 'date', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  required
                  value={entry.category}
                  onChange={e => updateEntry(entry.id, 'category', e.target.value)}
                  style={{ ...inputStyle, appearance: 'auto' }}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="Brief description of the expense"
                  value={entry.purpose}
                  onChange={e => updateEntry(entry.id, 'purpose', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Amount (INR)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={entry.amount}
                  onChange={e => updateEntry(entry.id, 'amount', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add entry button */}
      <button
        type="button"
        onClick={addEntry}
        style={{
          width: '100%', marginTop: '0.75rem',
          padding: '0.75rem', borderRadius: '0.625rem',
          border: '2px dashed var(--border)', background: 'transparent',
          color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem',
          cursor: 'pointer', minHeight: '44px',
        }}
      >
        + Add Another Entry
      </button>

      {/* Total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '1.25rem', padding: '1rem 1.25rem',
        background: 'linear-gradient(135deg, var(--primary-l), var(--surface))',
        border: '1px solid var(--border)', borderRadius: '0.75rem',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
          Total ({entries.length} item{entries.length !== 1 ? 's' : ''})
        </span>
        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.25rem' }}>
          INR {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Submit */}
      <div style={{ marginTop: '1.5rem' }}>
        <ConfirmSubmitButton
          label="Submit Reimbursement"
          confirmTitle="Submit Reimbursement"
          confirmMessage={`Submit ${entries.length} item(s) totalling INR ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for reimbursement?`}
          confirmLabel="Yes, Submit"
          variant="primary"
          style={{
            width: '100%', padding: '0.875rem', borderRadius: '0.625rem',
            border: 'none', background: allValid ? 'var(--primary)' : 'var(--border)',
            color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            cursor: allValid ? 'pointer' : 'not-allowed', minHeight: '48px',
            pointerEvents: allValid ? 'auto' : 'none',
            opacity: allValid ? 1 : 0.6,
          }}
        />
      </div>
    </form>
  )
}
