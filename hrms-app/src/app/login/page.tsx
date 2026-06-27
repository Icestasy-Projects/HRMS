import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ForgotPasswordButton from './ForgotPasswordButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMsg = params?.error

  async function signIn(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }
    redirect('/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1.25rem',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary), #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: '18px',
            margin: '0 auto 1rem',
          }}>IC</div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            Icestasy HRMS
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.375rem', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid var(--danger)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form action={signIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.375rem' }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              padding: '0.875rem',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              minHeight: '44px',
              boxShadow: 'var(--shadow)',
              letterSpacing: '-0.01em',
            }}
          >
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
