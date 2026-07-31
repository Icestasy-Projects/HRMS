'use client'

import { useRef, useState } from 'react'
import { Download } from 'lucide-react'

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
            background: isNet ? '#dcfce7' : isSub ? '#ede9fe' : undefined,
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: isSub || isNet ? 700 : 400 }}>{r.label}</span>
            <span style={{
              fontWeight: 700, fontSize: isSub ? '0.95rem' : isNet ? '1.1rem' : '0.9rem',
              color: isNet ? '#16a34a' : isSub ? '#7c3aed' : 'var(--text)',
            }}>{fmt(r.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function SalaryCalculator({ employees }: { employees: { id: string; name: string }[] }) {
  const [annual, setAnnual] = useState('')
  const [empName, setEmpName] = useState('')
  const [downloading, setDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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
  const adminCharge = Math.round(basic > 15000 ? 75 : basic * 0.005)
  const edli = a > 0 ? 75 : 0
  const totalEmployer = empESIC + empLWF + empPF + adminCharge + edli

  const gross = monthly - variable - totalEmployer
  const allowance = fixed - totalEmployer - basic - hra - lta

  const pfDed = Math.round(basic > 15000 ? 1800 : basic * 0.12)
  const esicDed = Math.round(basic < 21001 ? basic * 0.0075 : 0)
  const pt = a > 0 ? 200 : 0
  const totalDed = pfDed + esicDed + pt
  const net = gross - totalDed

  async function downloadPDF() {
    if (!printRef.current || !a) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 12
      const imgW = pageW - margin * 2
      const imgH = (canvas.height * imgW) / canvas.width

      let yPos = margin
      if (imgH <= pageH - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, yPos, imgW, imgH)
      } else {
        // Multi-page support
        let remaining = imgH
        let srcY = 0
        const sliceH = pageH - margin * 2
        while (remaining > 0) {
          const slicePx = Math.min(sliceH, remaining)
          pdf.addImage(imgData, 'PNG', margin, yPos, imgW, imgH, undefined, 'FAST', 0)
          srcY += slicePx
          remaining -= slicePx
          if (remaining > 0) { pdf.addPage(); yPos = margin }
        }
      }

      const safeName = (empName.trim() || 'Employee').replace(/\s+/g, '_')
      pdf.save(`${safeName}_salaryStructure.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      {/* Inputs */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '0.75rem', padding: '1.25rem', boxShadow: 'var(--shadow)', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Employee Name
            </label>
            <select
              value={empName}
              onChange={e => setEmpName(e.target.value)}
              style={{
                width: '100%', padding: '0.875rem 1rem', fontSize: '1rem', fontWeight: 600,
                border: '2px solid var(--border)', borderRadius: '0.625rem',
                background: 'var(--bg)', color: empName ? 'var(--text)' : 'var(--muted)',
                outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
                cursor: 'pointer',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            >
              <option value="">— Select employee —</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Annual CTC (₹)
            </label>
            <input
              type="number"
              value={annual}
              onChange={e => setAnnual(e.target.value)}
              placeholder="e.g. 600000"
              style={{
                width: '100%', padding: '0.875rem 1rem', fontSize: '1rem', fontWeight: 700,
                border: '2px solid var(--border)', borderRadius: '0.625rem',
                background: 'var(--bg)', color: 'var(--text)',
                outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>
        {a > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.875rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>
              Monthly CTC: <strong style={{ color: 'var(--primary)' }}>{fmt(monthly)}</strong>
            </p>
            <button
              onClick={downloadPDF}
              disabled={downloading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: downloading ? 'var(--muted)' : 'var(--primary)',
                color: '#fff', border: 'none', borderRadius: '0.625rem',
                padding: '0.5rem 1.125rem', fontSize: '0.875rem', fontWeight: 700,
                cursor: downloading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              <Download size={16} strokeWidth={2} />
              {downloading ? 'Generating…' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Printable area */}
      {a > 0 && (
        <div ref={printRef} style={{ background: '#fff', padding: '0.5rem' }}>
          {/* PDF header */}
          {(empName || a > 0) && (
            <div style={{
              background: 'linear-gradient(135deg, #5b1fa8, #7c2fc9)',
              borderRadius: '0.75rem', padding: '1.25rem 1.5rem', marginBottom: '1.25rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
            }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.2rem' }}>Salary Structure</p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>{empName || 'Employee'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: '0 0 0.2rem' }}>Annual CTC</p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>{fmt(a)}</p>
              </div>
            </div>
          )}

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
                { label: 'Admin Charges', value: adminCharge },
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
