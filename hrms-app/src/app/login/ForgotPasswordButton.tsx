'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ForgotPasswordButton() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  async function handleForgot() {
    const email = (document.getElementById('email') as HTMLInputElement)?.value
    if (!email) { alert('Enter your email address first, then click Forgot password.'); return }
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback` })
    setLoading(false)
    setSent(true)
  }
  if (sent) return <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>Reset link sent — check your email.</p>
  return (
    <button type="button" onClick={handleForgot} disabled={loading}
      className="text-sm hover:underline disabled:opacity-50" style={{ color: 'var(--primary)' }}>
      {loading ? 'Sending...' : 'Forgot password?'}
    </button>
  )
}
