import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  async function signIn(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const msg = encodeURIComponent('Invalid email or password. Please try again.')
      redirect(`/login?error=${msg}`)
    }

    redirect('/dashboard')
  }

  return (
    <LoginForm signIn={signIn} searchParams={searchParams} />
  )
}

async function LoginForm({
  signIn,
  searchParams,
}: {
  signIn: (formData: FormData) => Promise<void>
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMsg = params?.error

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">IC</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Icestasy HRMS</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to manage your attendance and leave</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 mb-4 text-sm font-medium">
              {decodeURIComponent(errorMsg)}
            </div>
          )}

          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@icestasy.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-700 text-white rounded-lg px-5 py-3 font-semibold hover:bg-blue-800 disabled:opacity-50 min-h-[44px] mt-1 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Icestasy HRMS · Attendance &amp; Leave Management
        </p>
      </div>
    </div>
  )
}
