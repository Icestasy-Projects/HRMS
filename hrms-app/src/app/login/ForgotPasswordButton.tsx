'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ForgotPasswordButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleForgotPassword() {
    const emailInput = document.getElementById('email') as HTMLInputElement
    const email = emailInput?.value?.trim()
    if (!email) {
      setMsg('Please enter your email address first.')
      setStatus('error')
      return
    }
    setStatus('loading')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/callback',
    })
    if (error) {
      setMsg(error.message)
      setStatus('error')
    } else {
      setMsg('Password reset email sent! Check your inbox.')
      setStatus('sent')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleForgotPassword}
        disabled={status === 'loading'}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--primary-h)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          padding: '0',
          textDecoration: 'underline',
        }}
      >
        {status === 'loading' ? 'Sending...' : 'Forgot password?'}
      </button>
      {msg && (
        <p style={{ color: status === 'sent' ? 'var(--success)' : 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          {msg}
        </p>
      )}
    </div>
  )
}
