import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'HRMS <noreply@icestasyprojects.com>'

  if (!key) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY is not set' }, { status: 500 })
  }

  const resend = new Resend(key)
  const { data, error } = await resend.emails.send({
    from,
    to: 'dcostat4@gmail.com',
    subject: '[HRMS] Test email ✅',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <div style="background:#7c2fc9;border-radius:12px 12px 0 0;padding:20px 24px">
          <h2 style="color:#fff;margin:0;font-size:18px">✅ Email is working!</h2>
        </div>
        <div style="background:#f9f9fb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
          <p style="color:#374151">If you can see this, Resend is configured correctly.</p>
          <p style="color:#6b7280;font-size:13px">Sent from: <strong>${from}</strong></p>
        </div>
      </div>`,
  })

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id, from })
}
