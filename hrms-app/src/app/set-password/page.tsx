'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetPasswordPage() {
  const router = useRouter()
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPass.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPass !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Update the password
    const { error: passErr } = await supabase.auth.updateUser({ password: newPass })
    if (passErr) {
      setError(passErr.message)
      setLoading(false)
      return
    }

    // Clear the must_change_password flag
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ must_change_password: false }).eq('id', user.id)
    }

    router.replace('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1.25rem', padding: '2rem', boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '18px', margin: '0 auto 1rem',
          }}>IC</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Set Your Password
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.375rem', fontSize: '0.9rem' }}>
            Create a secure password to continue.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
            borderRadius: '0.75rem', padding: '0.75rem 1rem',
            color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              required
              placeholder="Min. 8 characters"
              style={{
                width: '100%', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: '0.75rem',
                padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat new password"
              style={{
                width: '100%', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: '0.75rem',
                padding: '0.75rem 1rem', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: 'var(--primary)', color: '#fff',
              border: 'none', borderRadius: '0.75rem', padding: '0.875rem',
              fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: '0.25rem',
            }}
          >
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
