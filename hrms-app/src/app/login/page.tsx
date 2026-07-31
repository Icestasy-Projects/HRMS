import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ForgotPasswordButton from './ForgotPasswordButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const rawError = params?.error
  const errorMsg = rawError && rawError !== '{}' && rawError !== '[object Object]'
    ? rawError
    : rawError ? 'Invalid credentials. Please try again.' : null

  async function signIn(formData: FormData) {
    'use server'
    const identifier = (formData.get('identifier') as string)?.trim()
    const password = formData.get('password') as string
    const supabase = await createClient()

    let email = identifier

    // If input looks like a phone number, look up the email from users table
    const isPhone = /^[+\d\s\-()]{7,}$/.test(identifier) && !identifier.includes('@')
    if (isPhone) {
      const admin = createAdminClient()
      const normalized = identifier.replace(/\s+/g, '')
      const { data: userRow } = await admin
        .from('users')
        .select('email')
        .or(`phone.eq.${normalized},phone.eq.${identifier}`)
        .maybeSingle()
      if (!userRow?.email) {
        redirect(`/login?error=${encodeURIComponent('No account found for that phone number.')}`)
      }
      email = userRow.email
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }
    redirect('/dashboard')
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontSize: '1rem',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '1.25rem', padding: '2rem', boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #0f52a8, #1b72d8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="38" height="38" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 6C18 6 13 10 13 15.5C13 18 14.2 20.2 16 21.5V24H32V21.5C33.8 20.2 35 18 35 15.5C35 10 30 6 24 6Z" fill="white" fillOpacity="0.92"/>
              <path d="M20 15 Q24 11 28 15" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="15.5" cy="14" r="4" fill="white" fillOpacity="0.85"/>
              <circle cx="32.5" cy="14" r="4" fill="white" fillOpacity="0.85"/>
              <circle cx="24" cy="10" r="4.5" fill="white" fillOpacity="0.95"/>
              <rect x="13" y="24" width="22" height="5" rx="1.5" fill="white" fillOpacity="0.8"/>
              <rect x="11" y="29" width="26" height="2.5" rx="1.25" fill="white" fillOpacity="0.6"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Icestasy HRMS
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.375rem', fontSize: '0.9rem' }}>Sign in with email or phone</p>
        </div>

        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)',
            borderRadius: '0.75rem', padding: '0.75rem 1rem',
            color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem',
          }}>
            {errorMsg}
          </div>
        )}

        <form action={signIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="identifier" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Email or Phone Number
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="you@company.com or +91 98765 43210"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <button type="submit" style={{
            width: '100%', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: '0.75rem', padding: '0.875rem',
            fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            minHeight: '44px', boxShadow: 'var(--shadow)', letterSpacing: '-0.01em',
          }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <ForgotPasswordButton />
        </div>
      </div>
    </div>
  )
}
