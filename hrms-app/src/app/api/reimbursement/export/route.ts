import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

const CATEGORY_LABELS: Record<string, string> = {
  travel: 'Travel',
  meals: 'Meals',
  accommodation: 'Accommodation',
  office_supplies: 'Office Supplies',
  communication: 'Communication',
  training: 'Training',
  medical: 'Medical',
  other: 'Other',
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: employee } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!employee) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = ['super_admin', 'sub_super_admin', 'admin'].includes(employee.role)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  let rows: Record<string, unknown>[] = []

  if (employee.role === 'admin') {
    const { data: team } = await supabase.from('users').select('id').eq('manager_id', employee.id)
    const teamIds = team?.map(t => t.id) ?? []
    if (teamIds.length === 0) {
      return buildExcel([])
    }
    const { data } = await admin
      .from('reimbursements')
      .select('*, users!reimbursements_employee_id_fkey(name, email)')
      .in('employee_id', [...teamIds, employee.id])
      .order('created_at', { ascending: false })
    rows = data ?? []
  } else {
    const { data } = await admin
      .from('reimbursements')
      .select('*, users!reimbursements_employee_id_fkey(name, email)')
      .order('created_at', { ascending: false })
    rows = data ?? []
  }

  return buildExcel(rows)
}

function buildExcel(rows: Record<string, unknown>[]) {
  const sheetData = rows.map(r => {
    const emp = r.users as { name: string; email?: string } | null
    return {
      'Employee Name': emp?.name ?? 'Unknown',
      'Email': emp?.email ?? '-',
      'Batch ID': (r.batch_id as string).slice(0, 8),
      'Expense Date': r.expense_date as string,
      'Category': CATEGORY_LABELS[r.category as string] ?? (r.category as string),
      'Purpose': r.purpose as string,
      'Amount (INR)': Number(r.amount),
      'Status': (r.status as string).charAt(0).toUpperCase() + (r.status as string).slice(1),
      'Submitted On': new Date(r.created_at as string).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      }),
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sheetData.length > 0 ? sheetData : [{ 'Employee Name': 'No data' }])

  const colWidths = [
    { wch: 22 }, // Employee Name
    { wch: 28 }, // Email
    { wch: 12 }, // Batch ID
    { wch: 14 }, // Expense Date
    { wch: 16 }, // Category
    { wch: 30 }, // Purpose
    { wch: 14 }, // Amount
    { wch: 12 }, // Status
    { wch: 16 }, // Submitted On
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'All Reimbursements')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reimbursements-${today}.xlsx"`,
    },
  })
}
