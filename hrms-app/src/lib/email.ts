import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'HRMS <noreply@icestasyprojects.com>'

export async function sendLeaveAppliedEmail({
  managerEmail, managerName, employeeName,
  leaveType, startDate, endDate, daysCount, reason, isUnscheduled,
}: {
  managerEmail: string; managerName: string; employeeName: string
  leaveType: string; startDate: string; endDate: string; daysCount: number
  reason?: string; isUnscheduled: boolean
}) {
  const subject = isUnscheduled
    ? `[HRMS] ${employeeName} has taken unscheduled leave`
    : `[HRMS] Leave request from ${employeeName} — Action Required`

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="background:#7c2fc9;border-radius:12px 12px 0 0;padding:20px 24px">
        <h2 style="color:#fff;margin:0;font-size:18px">${isUnscheduled ? '📋 Unscheduled Leave Notification' : '📩 Leave Request — Action Required'}</h2>
      </div>
      <div style="background:#f9f9fb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <p style="color:#374151;margin:0 0 16px">Hi ${managerName},</p>
        <p style="color:#374151;margin:0 0 16px">
          ${isUnscheduled
            ? `<strong>${employeeName}</strong> has taken unscheduled leave and you are being notified.`
            : `<strong>${employeeName}</strong> has submitted a leave request that requires your approval.`}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          ${row('Employee', employeeName)}
          ${row('Leave Type', leaveType === 'SL' ? 'Scheduled Leave' : 'Unscheduled Leave')}
          ${row('From', formatDate(startDate))}
          ${row('To', formatDate(endDate))}
          ${row('Duration', `${daysCount} day${daysCount !== 1 ? 's' : ''}`)}
          ${reason ? row('Reason', reason) : ''}
        </table>
        ${!isUnscheduled ? `
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hrms-kappa-nine.vercel.app'}/team/leave"
           style="display:inline-block;background:#7c2fc9;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Review Request →
        </a>` : ''}
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">This is an automated message from Icestasy HRMS. Please do not reply.</p>
      </div>
    </div>`

  if (!process.env.RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY is not set — skipping sendLeaveAppliedEmail')
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: FROM, to: managerEmail, subject, html })
  if (error) console.error('[email] sendLeaveAppliedEmail failed:', error)
}

export async function sendLeaveDecisionEmail({
  employeeEmail, employeeName, managerName, approved,
  leaveType, startDate, endDate, daysCount,
}: {
  employeeEmail: string; employeeName: string; managerName: string; approved: boolean
  leaveType: string; startDate: string; endDate: string; daysCount: number
}) {
  const subject = approved
    ? `[HRMS] Your leave request has been approved ✅`
    : `[HRMS] Your leave request has been rejected ❌`

  const color = approved ? '#059669' : '#dc2626'
  const icon = approved ? '✅' : '❌'
  const label = approved ? 'Approved' : 'Rejected'

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="background:${color};border-radius:12px 12px 0 0;padding:20px 24px">
        <h2 style="color:#fff;margin:0;font-size:18px">${icon} Leave Request ${label}</h2>
      </div>
      <div style="background:#f9f9fb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <p style="color:#374151;margin:0 0 16px">Hi ${employeeName},</p>
        <p style="color:#374151;margin:0 0 16px">
          Your leave request has been <strong style="color:${color}">${label.toLowerCase()}</strong>${managerName ? ` by <strong>${managerName}</strong>` : ''}.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          ${row('Leave Type', leaveType === 'SL' ? 'Scheduled Leave' : 'Unscheduled Leave')}
          ${row('From', formatDate(startDate))}
          ${row('To', formatDate(endDate))}
          ${row('Duration', `${daysCount} day${daysCount !== 1 ? 's' : ''}`)}
          ${row('Status', label)}
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hrms-kappa-nine.vercel.app'}/leave/history"
           style="display:inline-block;background:#7c2fc9;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          View Leave History →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">This is an automated message from Icestasy HRMS. Please do not reply.</p>
      </div>
    </div>`

  if (!process.env.RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY is not set — skipping sendLeaveDecisionEmail')
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: FROM, to: employeeEmail, subject, html })
  if (error) console.error('[email] sendLeaveDecisionEmail failed:', error)
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;width:40%">${label}</td>
    <td style="padding:8px 12px;background:#fff;border:1px solid #e5e7eb;color:#111827;font-size:13px;font-weight:600">${value}</td>
  </tr>`
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
