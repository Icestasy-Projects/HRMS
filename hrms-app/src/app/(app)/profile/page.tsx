'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Breadcrumb from '@/components/Breadcrumb'

export default function ProfilePage() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!current) {
      setStatus('error')
      setMessage('Current password is required.')
      return
    }
    if (newPass !== confirm) {
      setStatus('error')
      setMessage('New passwords do not match.')
      return
    }
    if (newPass.length < 8) {
      setStatus('error')
      setMessage('Password must be at least 8 characters.')
      return
    }
    setConfirming(true)
  }

  async function handleConfirm() {
    setConfirming(false)
    setStatus('loading')
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setStatus('error')
      setMessage('Unable to verify identity. Please log in again.')
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInError) {
      setStatus('error')
      setMessage('Current password is incorrect.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Password updated successfully.')
      setCurrent('')
      setNewPass('')
      setConfirm('')
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Breadcrumb crumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Change Password' }]} />
        <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Change Password
        </h1>
      </div>

      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998,
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '1rem', padding: '2rem 1.75rem',
            maxWidth: '360px', width: '90%', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', margin: '0 0 0.5rem' }}>
              Update Password
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
              Are you sure you want to change your password?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.625rem',
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.625rem',
                  border: 'none', background: 'var(--primary)',
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
        {status === 'success' && (
          <div style={{ background: 'var(--success-l, #dcfce7)', border: '1px solid var(--success, #16a34a)', borderRadius: '0.75rem', padding: '0.875rem 1.125rem', color: 'var(--success, #16a34a)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
            ✓ {message}
          </div>
        )}
        {status === 'error' && (
          <div style={{ background: 'var(--danger-l)', border: '1px solid var(--danger)', borderRadius: '0.75rem', padding: '0.875rem 1.125rem', color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="current-password" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '0.375rem' }}>Current Password</label>
            <input
              id="current-password"
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
              placeholder="Enter current password"
              autoComplete="current-password"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label htmlFor="new-password" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '0.375rem' }}>New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              required
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '0.375rem' }}>Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat new password"
              autoComplete="new-password"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: 600, fontSize: '0.9rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer', opacity: status === 'loading' ? 0.7 : 1 }}
          >
            {status === 'loading' ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
