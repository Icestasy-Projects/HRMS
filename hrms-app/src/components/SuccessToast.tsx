'use client'

import { useState, useEffect } from 'react'

export default function SuccessToast({ message }: { message: string }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--success)', color: '#fff',
      borderRadius: '0.75rem', padding: '0.875rem 1.5rem',
      fontWeight: 700, fontSize: '0.95rem', zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}
