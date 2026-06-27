'use client'

import { useLinkStatus } from 'next/link'
import { useEffect, useState } from 'react'

export default function NavProgress() {
  const { pending } = useLinkStatus()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (pending) {
      setVisible(true)
      setWidth(30)
      const t = setTimeout(() => setWidth(70), 150)
      return () => clearTimeout(t)
    } else {
      setWidth(100)
      const t = setTimeout(() => { setVisible(false); setWidth(0) }, 300)
      return () => clearTimeout(t)
    }
  }, [pending])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      height: '3px', width: `${width}%`,
      background: 'linear-gradient(90deg, #c084fc, #fff)',
      transition: pending ? 'width 0.4s ease' : 'width 0.2s ease',
      borderRadius: '0 2px 2px 0',
      boxShadow: '0 0 8px rgba(192,132,252,0.6)',
    }} />
  )
}
