function optional(key: string, fallback: string): string {
  return process.env[key] || fallback
}

export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  EMAIL_FROM: optional('EMAIL_FROM', 'HRMS <noreply@icestasyprojects.com>'),
  APP_URL: optional('NEXT_PUBLIC_APP_URL', 'https://hrms-kappa-nine.vercel.app'),
  DEFAULT_EMPLOYEE_PASSWORD: optional('DEFAULT_EMPLOYEE_PASSWORD', 'IceCreamOps@123'),
  SITE_URL: optional('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000'),
} as const
