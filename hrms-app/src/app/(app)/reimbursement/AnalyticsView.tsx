'use client'

import { useState } from 'react'

interface EmployeeAnalytics {
  employeeId: string
  name: string
  monthly: Record<string, number>
  categoryByYear: Record<string, Record<string, number>>
  yearlyTotals: Record<string, number>
  statusByYear: Record<string, { approved: number; pending: number; rejected: number }>
}

const CATEGORY_COLORS: Record<string, string> = {
  travel: '#3b82f6',
  meals: '#f59e0b',
  accommodation: '#8b5cf6',
  office_supplies: '#10b981',
  communication: '#6366f1',
  training: '#ec4899',
  medical: '#ef4444',
  other: '#94a3b8',
}

const MONTH_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTH_FULL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatCompact(n: number) {
  if (n >= 100000) {
    const v = n / 100000
    return v === Math.floor(v) ? `${v.toFixed(0)}L` : `${v.toFixed(1)}L`
  }
  if (n >= 1000) {
    const v = n / 1000
    return v === Math.floor(v) ? `${v.toFixed(0)}K` : `${v.toFixed(1)}K`
  }
  return n.toFixed(0)
}

function formatINR(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function EmployeeCard({ emp, year, prevYear, categoryLabels }: {
  emp: {
    name: string
    yearTotal: number
    prevTotal: number
    monthlyForYear: number[]
    cats: Record<string, number>
    yearlyTotals: Record<string, number>
    statusByYear: Record<string, { approved: number; pending: number; rejected: number }>
  }
  year: string
  prevYear: string
  categoryLabels: Record<string, string>
}) {
  const maxMonth = Math.max(...emp.monthlyForYear, 1)
  const yoyChange = emp.prevTotal > 0
    ? ((emp.yearTotal - emp.prevTotal) / emp.prevTotal * 100)
    : null

  const catEntries = Object.entries(emp.cats).sort((a, b) => b[1] - a[1])
  const catTotal = catEntries.reduce((s, [, v]) => s + v, 0)

  const yearTotals = Object.entries(emp.yearlyTotals).sort((a, b) => b[0].localeCompare(a[0]))
  const yearStatus = emp.statusByYear[year] ?? { approved: 0, pending: 0, rejected: 0 }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', margin: 0 }}>
              {emp.name}
            </p>
            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.25rem', margin: '0.25rem 0 0' }}>
              ₹{formatINR(emp.yearTotal)}
            </p>
          </div>
          {yoyChange !== null && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600,
              color: 'var(--muted)', background: 'var(--bg)',
              padding: '0.2rem 0.5rem', borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}>
              {yoyChange >= 0 ? '↑' : '↓'} {Math.abs(yoyChange).toFixed(0)}% vs {prevYear}
            </span>
          )}
        </div>
      </div>

      {/* Monthly bars */}
      <div style={{ padding: '0.75rem 1.25rem' }}>
        <p style={{
          fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem',
        }}>
          Monthly Spending
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '56px' }}>
          {emp.monthlyForYear.map((amt, i) => {
            const pct = maxMonth > 0 ? (amt / maxMonth) * 100 : 0
            return (
              <div key={i} title={`${MONTH_FULL[i]}: ₹${formatINR(amt)}`} style={{
                flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
              }}>
                <div style={{
                  width: '100%', maxWidth: '32px',
                  height: `${Math.max(pct, 3)}%`,
                  background: amt > 0 ? 'var(--primary)' : 'var(--border)',
                  borderRadius: '2px 2px 0 0',
                  opacity: amt > 0 ? 1 : 0.3,
                  transition: 'height 0.3s ease',
                }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
          {MONTH_SHORT.map((m, i) => (
            <span key={i} style={{
              flex: 1, textAlign: 'center' as const, fontSize: '0.58rem',
              color: emp.monthlyForYear[i] > 0 ? 'var(--text)' : 'var(--muted)',
              fontWeight: emp.monthlyForYear[i] > 0 ? 600 : 400,
            }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      {catEntries.length > 0 && (
        <div style={{ padding: '0 1.25rem 0.75rem' }}>
          <p style={{
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.5rem',
          }}>
            Where They Spent
          </p>
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', height: '8px', marginBottom: '0.5rem' }}>
            {catEntries.map(([cat, amt]) => (
              <div
                key={cat}
                title={`${categoryLabels[cat] ?? cat}: ₹${formatINR(amt)} (${((amt / catTotal) * 100).toFixed(0)}%)`}
                style={{
                  flexBasis: `${(amt / catTotal) * 100}%`,
                  background: CATEGORY_COLORS[cat] ?? '#94a3b8',
                  minWidth: '2px',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem 0.75rem' }}>
            {catEntries.slice(0, 5).map(([cat, amt]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '2px',
                  background: CATEGORY_COLORS[cat] ?? '#94a3b8', flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                  {categoryLabels[cat] ?? cat} {((amt / catTotal) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year on Year */}
      {yearTotals.length > 1 && (
        <div style={{ padding: '0 1.25rem 0.75rem' }}>
          <p style={{
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 0.375rem',
          }}>
            Year on Year
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {yearTotals.map(([y, total]) => (
              <span key={y} style={{
                fontSize: '0.72rem',
                fontWeight: y === year ? 700 : 400,
                color: y === year ? 'var(--primary)' : 'var(--muted)',
                background: y === year ? 'var(--primary-l, #e0e7ff)' : 'var(--bg)',
                padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
              }}>
                {y}: ₹{formatCompact(total)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status footer */}
      <div style={{
        display: 'flex', gap: '1px', borderTop: '1px solid var(--border)',
        background: 'var(--border)',
      }}>
        {[
          { label: 'Approved', amount: yearStatus.approved, color: 'var(--success, #059669)' },
          { label: 'Pending', amount: yearStatus.pending, color: 'var(--warning, #d97706)' },
          { label: 'Rejected', amount: yearStatus.rejected, color: 'var(--danger, #dc2626)' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--surface)',
            padding: '0.5rem 0.75rem', textAlign: 'center' as const,
          }}>
            <p style={{
              fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase',
              color: s.color, margin: 0, letterSpacing: '0.04em',
            }}>
              {s.label}
            </p>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: s.color, margin: '0.15rem 0 0' }}>
              ₹{formatCompact(s.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsView({
  analytics, categoryLabels, availableYears,
}: {
  analytics: EmployeeAnalytics[]
  categoryLabels: Record<string, string>
  availableYears: string[]
}) {
  const currentYear = new Date().getFullYear().toString()
  const [year, setYear] = useState(
    availableYears.includes(currentYear) ? currentYear : availableYears[0] ?? currentYear
  )
  const prevYear = (parseInt(year) - 1).toString()

  if (analytics.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center',
      }}>
        <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📊</p>
        <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No analytics data</p>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
          Reimbursement data will appear here once claims are submitted.
        </p>
      </div>
    )
  }

  const yearEmployees = analytics
    .map(emp => {
      const yearTotal = emp.yearlyTotals[year] ?? 0
      const prevTotal = emp.yearlyTotals[prevYear] ?? 0
      const monthlyForYear = Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${String(i + 1).padStart(2, '0')}`
        return emp.monthly[key] ?? 0
      })
      const cats = emp.categoryByYear[year] ?? {}
      return { ...emp, yearTotal, prevTotal, monthlyForYear, cats }
    })
    .filter(e => e.yearTotal > 0)
    .sort((a, b) => b.yearTotal - a.yearTotal)

  const orgYearTotal = yearEmployees.reduce((s, e) => s + e.yearTotal, 0)
  const orgPrevTotal = analytics.reduce((s, e) => s + (e.yearlyTotals[prevYear] ?? 0), 0)
  const orgYoY = orgPrevTotal > 0
    ? ((orgYearTotal - orgPrevTotal) / orgPrevTotal * 100)
    : null

  return (
    <div>
      {/* Year selector */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {availableYears.map(y => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '999px',
              border: year === y ? 'none' : '1px solid var(--border)',
              background: year === y ? 'var(--primary)' : 'var(--surface)',
              color: year === y ? '#fff' : 'var(--text)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              minHeight: '34px',
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Org summary */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-l, #e0e7ff), var(--surface))',
        border: '1px solid var(--border)', borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div>
          <p style={{ color: 'var(--primary)', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
            ₹{formatINR(orgYearTotal)}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>
            Total org spend in {year} &middot; {yearEmployees.length} employee{yearEmployees.length !== 1 ? 's' : ''}
          </p>
        </div>
        {orgYoY !== null && (
          <span style={{
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)',
            background: 'var(--surface)', padding: '0.3rem 0.75rem',
            borderRadius: '999px', border: '1px solid var(--border)',
          }}>
            {orgYoY >= 0 ? '↑' : '↓'} {Math.abs(orgYoY).toFixed(0)}% vs {prevYear}
          </span>
        )}
      </div>

      {/* Employee cards grid */}
      {yearEmployees.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '2.5rem 1.5rem', textAlign: 'center',
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', margin: '0 0 0.25rem' }}>No data for {year}</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>Try selecting a different year.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1rem',
        }}>
          {yearEmployees.map(emp => (
            <EmployeeCard
              key={emp.employeeId}
              emp={emp}
              year={year}
              prevYear={prevYear}
              categoryLabels={categoryLabels}
            />
          ))}
        </div>
      )}
    </div>
  )
}
