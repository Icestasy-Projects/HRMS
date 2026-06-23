import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ForgotPasswordButton from './ForgotPasswordButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  async function signIn(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      redirect(`/login?error=${encodeURIComponent('Invalid email or password. Please try again.')}`)
    }
    redirect('/dashboard')
  }

  const params = await searchParams
  const errorMsg = params?.error
  const message = params?.message

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-bold text-white text-2xl mb-4"
            style={{ background: 'var(--primary)' }}>IC</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Welcome to Icestasy HRMS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Sign in to manage attendance and leave</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {errorMsg && (
            <div className="rounded-lg px-4 py-3 mb-4 text-sm font-medium border"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {decodeURIComponent(errorMsg)}
            </div>
          )}
          {message && (
            <div className="rounded-lg px-4 py-3 mb-4 text-sm font-medium border"
              style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#86efac' }}>
              {decodeURIComponent(message)}
            </div>
          )}

          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                Email address
              </label>
              <input id="email" name="email" type="email" required autoComplete="email"
                placeholder="you@icestasyprojects.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                Password
              </label>
              <input id="password" name="password" type="password" required autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            <button type="submit"
              className="w-full rounded-xl py-3 font-bold text-white text-base transition-colors mt-1"
              style={{ background: 'var(--primary)', minHeight: '48px' }}>
              Sign In
            </button>
          </form>

          <div className="mt-4 text-center">
            <ForgotPasswordButton />
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          Icestasy HRMS · Attendance &amp; Leave Management
        </p>
      </div>
    </div>
  )
}
