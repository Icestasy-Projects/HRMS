'use client'

import { useState } from 'react'

function fmt(v: number) {
  if (v === 0) return '₹0'
  return '₹' + Math.round(v).toLocaleString('en-IN')
}

function Section({ title, rows }: { title: string; rows: { label: string; value: number; bold?: boolean; highlight?: 'net' | 'sub' }[] }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: '1rem',
    }}>
      <div style={{ background: 'var(--primary)', padding: '0.625rem 1.25rem' }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{title}</p>
      </div>
      {rows.map((r, i) => {
        const isNet = r.highlight === 'net'
        const isSub = r.highlight === 'sub'
        return (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.625rem 1.25rem',
            borderTop: i > 0 ? '1px solid var(--border)' : undefined,
            background: isNet ? 'var(--success-l)' : isSub ? 'var(--primary-l)' : undefined,
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: isSub || isNet ? 700 : 400 }}>{r.label}</span>
            <span style={{
              fontWeight: 700, fontSize: isSub ? '0.95rem' : isNet ? '1.1rem' : '0.9rem',
              color: isNet ? 'var(--success)' : isSub ? 'var(--primary)' : 'var(--text)',
            }}>{fmt(r.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function SalaryCalculator() {
  const [annual, setAnnual] = useState('')

  const a = Number(annual) || 0
  const monthly = a / 12
  const variable = monthly * 0.25
  const fixed = monthly - variable
  const basic = fixed * 0.50
  const hra = basic * 0.50
  const lta = basic * 0.10

  const empESIC = Math.round(basic < 21001 ? basic * 0.0325 : 0)
  const empLWF = a > 0 ? 12 : 0
  const empPF = Math.round(basic > 15000 ? 1800 : basic * 0.12)
  const admin = Math.round(basic > 15000 ? 75 : basic * 0.005)
  const edli = a > 0 ? 75 : 0
  const totalEmployer = empESIC + empLWF + empPF + admin + edli

  const gross = monthly - variable - totalEmployer
  const allowance = fixed - totalEmployer - basic - hra - lta

  const pfDed = Math.round(basic > 15000 ? 1800 : basic * 0.12)
  const esicDed = Math.round(basic < 21001 ? basic * 0.0075 : 0)
  const pt = a > 0 ? 200 : 0
  const totalDed = pfDed + esicDed + pt
  const net = gross - totalDed

  return (
    <div>
      {/* Input */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.25rem', boxShadow: 'var(--shadow)', marginBottom: '1.5rem',
      }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Annual CTC (₹)
        </label>
        <input
          type="number"
          value={annual}
          onChange={e => setAnnual(e.target.value)}
          placeholder="e.g. 600000"
          style={{
            width: '100%', padding: '0.875rem 1rem', fontSize: '1.25rem', fontWeight: 700,
            border: '2px solid var(--border)', borderRadius: '0.625rem',
            background: 'var(--bg)', color: 'var(--text)',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {a > 0 && (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.375rem' }}>
            Monthly CTC: <strong style={{ color: 'var(--primary)' }}>{fmt(monthly)}</strong>
          </p>
        )}
      </div>

      {a > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0 1.25rem' }}>
          <div>
            <Section title="Monthly Breakdown" rows={[
              { label: 'Monthly CTC', value: monthly },
              { label: 'Variable Pay (25%)', value: variable },
              { label: 'Fixed Pay (75%)', value: fixed, bold: true, highlight: 'sub' },
            ]} />

            <Section title="Employer Contributions" rows={[
              { label: 'Employer ESIC (3.25%)', value: empESIC },
              { label: 'Employer LWF', value: empLWF },
              { label: 'Employer PF', value: empPF },
              { label: 'Admin Charges', value: admin },
              { label: 'EDLI', value: edli },
              { label: 'Total Employer Contribution', value: totalEmployer, highlight: 'sub' },
            ]} />
          </div>

          <div>
            <Section title="Salary Components" rows={[
              { label: 'Monthly Gross', value: gross },
              { label: 'Basic (50% of Fixed)', value: basic },
              { label: 'HRA (50% of Basic)', value: hra },
              { label: 'LTA (10% of Basic)', value: lta },
              { label: 'Variable Allowance', value: allowance, highlight: 'sub' },
            ]} />

            <Section title="Employee Deductions" rows={[
              { label: 'Employee PF (12%)', value: pfDed },
              { label: 'Employee ESIC (0.75%)', value: esicDed },
              { label: 'Professional Tax', value: pt },
              { label: 'Total Deductions', value: totalDed, highlight: 'sub' },
            ]} />

            <Section title="Take Home" rows={[
              { label: 'Net Monthly Salary', value: net, highlight: 'net' },
            ]} />
          </div>
        </div>
      )}

      {!a && (
        <div style={{
          textAlign: 'center', padding: '3rem', color: 'var(--muted)',
          background: 'var(--surface)', borderRadius: '0.75rem', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧮</p>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>Enter Annual CTC to calculate</p>
          <p style={{ fontSize: '0.875rem' }}>Salary structure will appear here</p>
        </div>
      )}
    </div>
  )
}
