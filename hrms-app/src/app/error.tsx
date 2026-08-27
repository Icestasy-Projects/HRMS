'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '420px', width: '100%', textAlign: 'center',
        background: 'var(--surface, #fff)', border: '1px solid var(--border, #e5e7eb)',
        borderRadius: '1rem', padding: '2.5rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <p style={{ fontSize: '2.5rem', margin: '0 0 0.75rem' }}>!</p>
        <h2 style={{
          fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--text, #111)', margin: '0 0 0.5rem',
        }}>
          Something went wrong
        </h2>
        <p style={{
          color: 'var(--muted, #6b7280)', fontSize: '0.875rem',
          margin: '0 0 1.5rem', lineHeight: 1.5,
        }}>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          style={{
            background: 'var(--primary, #2563eb)', color: '#fff',
            border: 'none', borderRadius: '0.75rem',
            padding: '0.75rem 2rem', fontWeight: 600,
            fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
