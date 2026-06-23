'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-bold text-white text-2xl mb-4"
            style={{ background: 'var(--primary)' }}>IC</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Set new password</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Choose a new password for your account</p>
        </div>
        <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                placeholder="At least 6 characters"
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder="Repeat your password"
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm border"
                style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 font-bold text-white transition-colors"
              style={{ background: 'var(--primary)', minHeight: '48px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving...' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
