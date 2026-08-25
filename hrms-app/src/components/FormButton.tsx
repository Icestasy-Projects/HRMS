'use client'

import { useFormStatus } from 'react-dom'

export default function FormButton({
  label,
  pendingLabel,
  style,
}: {
  label: string
  pendingLabel: string
  style: React.CSSProperties
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        ...style,
        opacity: pending ? 0.65 : 1,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}
