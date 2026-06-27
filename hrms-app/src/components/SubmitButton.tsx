'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  loadingText,
  style,
}: {
  children: React.ReactNode
  loadingText?: string
  style?: React.CSSProperties
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        cursor: pending ? 'not-allowed' : 'pointer',
        opacity: pending ? 0.8 : 1,
        ...style,
      }}
    >
      {pending && (
        <span style={{
          width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff', borderRadius: '50%',
          display: 'inline-block', flexShrink: 0,
          animation: 'spin 0.6s linear infinite',
        }} />
      )}
      {pending ? (loadingText ?? 'Saving...') : children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
