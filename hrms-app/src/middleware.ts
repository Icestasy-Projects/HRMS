import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { log } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  const start = Date.now()
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicRoutes = ['/login', '/auth/callback', '/update-password']
  const isPublic = publicRoutes.some(r => request.nextUrl.pathname.startsWith(r))

  if (!user && !isPublic) {
    log.auth.warn('Unauthenticated access attempt', {
      path: request.nextUrl.pathname,
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
    })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const duration = Date.now() - start
  if (duration > 2000) {
    log.request.warn('Slow request', {
      path: request.nextUrl.pathname,
      method: request.method,
      duration_ms: duration,
      user_id: user?.id,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
