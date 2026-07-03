'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'


interface Employee {
  id: string
  name: string
  department_id: string | null
  role: string
}

interface Department {
  id: string
  name: string
}

interface LeaveRequest {
  employee_id: string
  start_date: string
  end_date: string
  leave_type: string
  status: string
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa']

function pad(n: number) { return String(n).padStart(2, '0') }

export default function TeamCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = `${year}-${pad(month + 1)}-01`
    const lastDay = `${year}-${pad(month + 1)}-${pad(daysInMonth)}`

    const [{ data: emps }, { data: depts }, { data: leaveData }] = await Promise.all([
      supabase.from('users').select('id, name, department_id, role').eq('is_active', true).order('name'),
      supabase.from('departments').select('id, name').order('name'),
      supabase.from('leave_requests')
        .select('employee_id, start_date, end_date, leave_type, status')
        .in('status', ['approved', 'pending'])
        .lte('start_date', lastDay)
        .gte('end_date', firstDay),
    ])

    setEmployees(emps ?? [])
    setDepartments(depts ?? [])
    setLeaves(leaveData ?? [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchData() }, [fetchData])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayY = now.getFullYear()
  const todayM = now.getMonth()
  const todayD = now.getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Group employees by department
  const deptMap = new Map(departments.map(d => [d.id, d.name]))
  const grouped: { deptId: string | null; deptName: string; emps: Employee[] }[] = []
  const seenDepts = new Set<string | null>()
  // Sort: departments first (alphabetically), then "No Department"
  const sortedEmps = [...employees].sort((a, b) => {
    const da = a.department_id ? (deptMap.get(a.department_id) ?? '') : 'zzz'
    const db = b.department_id ? (deptMap.get(b.department_id) ?? '') : 'zzz'
    if (da !== db) return da.localeCompare(db)
    return a.name.localeCompare(b.name)
  })
  for (const emp of sortedEmps) {
    if (!seenDepts.has(emp.department_id)) {
      seenDepts.add(emp.department_id)
      grouped.push({
        deptId: emp.department_id,
        deptName: emp.department_id ? (deptMap.get(emp.department_id) ?? 'Unknown') : 'No Department',
        emps: [],
      })
    }
    grouped[grouped.length - 1].emps.push(emp)
  }

  // Build leave map: empId -> dateStr -> status ('approved' | 'pending')
  // approved takes priority over pending if both exist on same date
  const leaveMap = new Map<string, Map<string, string>>()
  for (const lr of leaves) {
    if (!leaveMap.has(lr.employee_id)) leaveMap.set(lr.employee_id, new Map())
    const empMap = leaveMap.get(lr.employee_id)!
    const [sy, sm, sd] = lr.start_date.split('-').map(Number)
    const [ey, em, ed] = lr.end_date.split('-').map(Number)
    const cur = new Date(Date.UTC(sy, sm - 1, sd))
    const end = new Date(Date.UTC(ey, em - 1, ed))
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0]
      if (lr.status === 'approved' || !empMap.has(key)) {
        empMap.set(key, lr.status)
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
  }

  const nameColW = 160

  return (
    <div>
      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1.25rem', flexWrap: 'wrap',
      }}>
        <button
          onClick={prevMonth}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.5rem', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1rem', color: 'var(--text)', fontWeight: 700,
          }}
        >‹</button>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', minWidth: '160px', textAlign: 'center' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.5rem', width: '38px', height: '38px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1rem', color: 'var(--text)', fontWeight: 700,
          }}
        >›</button>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Available', bg: '#bbf7d0', border: '#86efac' },
            { label: 'Leave Pending', bg: '#fde68a', border: '#fcd34d' },
            { label: 'Leave Approved', bg: '#fecaca', border: '#fca5a5' },
            { label: 'Weekend', bg: 'var(--surface2)', border: 'var(--border)' },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.bg, display: 'inline-block', flexShrink: 0, border: `1px solid ${l.border}` }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: `${nameColW + daysInMonth * 38}px`, width: '100%', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                {/* Name header — sticky */}
                <th style={{
                  position: 'sticky', left: 0, zIndex: 3,
                  background: 'var(--surface)',
                  borderBottom: '2px solid var(--border)',
                  borderRight: '2px solid var(--border)',
                  padding: '0.625rem 1rem',
                  textAlign: 'left', fontWeight: 700,
                  color: 'var(--muted)', fontSize: '0.72rem',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  minWidth: `${nameColW}px`, width: `${nameColW}px`,
                }}>
                  Employee
                </th>
                {days.map(d => {
                  const dow = new Date(Date.UTC(year, month, d)).getUTCDay()
                  const isWeekend = dow === 0 || dow === 6
                  const isToday = year === todayY && month === todayM && d === todayD
                  return (
                    <th key={d} style={{
                      background: isToday ? 'var(--primary)' : isWeekend ? 'var(--surface2)' : 'var(--surface)',
                      borderBottom: '2px solid var(--border)',
                      borderRight: '1px solid var(--border)',
                      padding: '0.25rem 0',
                      textAlign: 'center',
                      color: isToday ? '#fff' : isWeekend ? 'var(--muted)' : 'var(--text)',
                      fontWeight: isToday ? 700 : 600,
                      minWidth: '38px', width: '38px',
                    }}>
                      <div style={{ fontSize: '0.7rem', color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--muted)', fontWeight: 400 }}>
                        {DAY_ABBR[dow]}
                      </div>
                      <div>{d}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {grouped.map(group => (
                <>
                  {/* Department header row */}
                  <tr key={`dept-${group.deptId}`}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 2,
                      background: 'var(--primary-l)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      borderRight: '2px solid var(--border)',
                      padding: '0.45rem 1rem',
                      fontWeight: 700, fontSize: '0.72rem',
                      color: 'var(--primary)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                      minWidth: `${nameColW}px`, width: `${nameColW}px`,
                    }}>
                      {group.deptName}
                    </td>
                    <td colSpan={daysInMonth} style={{
                      background: 'var(--primary-l)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                    }} />
                  </tr>
                  {group.emps.map((emp, empIdx) => {
                    const empLeaves = leaveMap.get(emp.id)
                    return (
                      <tr key={emp.id} style={{ background: empIdx % 2 === 0 ? 'var(--surface)' : 'transparent' }}>
                        {/* Name cell — sticky */}
                        <td style={{
                          position: 'sticky', left: 0, zIndex: 1,
                          background: empIdx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                          borderRight: '2px solid var(--border)',
                          borderBottom: '1px solid var(--border)',
                          padding: '0.5rem 1rem',
                          fontWeight: 600, color: 'var(--text)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          maxWidth: `${nameColW}px`,
                        }}>
                          {emp.name}
                        </td>
                        {days.map(d => {
                          const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
                          const leaveType = empLeaves?.get(dateStr)
                          const dow = new Date(Date.UTC(year, month, d)).getUTCDay()
                          const isWeekend = dow === 0 || dow === 6
                          const isToday = year === todayY && month === todayM && d === todayD

                          let bg = '#bbf7d0'  // green = available
                          let textColor = 'transparent'
                          let cellText = ''
                          if (leaveType === 'pending') { bg = '#fde68a'; textColor = '#92400e'; cellText = '?' }
                          else if (leaveType === 'approved') { bg = '#fecaca'; textColor = '#991b1b'; cellText = '✕' }
                          else if (isWeekend) bg = 'rgba(0,0,0,0.04)'

                          return (
                            <td key={d} style={{
                              background: bg,
                              borderBottom: '1px solid var(--border)',
                              borderRight: '1px solid var(--border)',
                              textAlign: 'center',
                              padding: '0.35rem 0',
                              color: textColor,
                              fontWeight: leaveType ? 700 : 400,
                              fontSize: '0.68rem',
                              outline: isToday ? '2px solid rgba(139,47,201,0.25)' : 'none',
                              outlineOffset: '-2px',
                            }}>
                              {cellText}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
