'use client'

import Link from 'next/link'
import {
  Clock, Leaf, ClipboardList, CalendarDays, Bell,
  CalendarCheck, CalendarRange, Users, Network,
  CheckSquare, Settings,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ReactNode> = {
  '/attendance':         <Clock size={26} strokeWidth={1.75} />,
  '/leave':              <Leaf size={26} strokeWidth={1.75} />,
  '/leave/history':      <ClipboardList size={26} strokeWidth={1.75} />,
  '/attendance/history': <CalendarDays size={26} strokeWidth={1.75} />,
  '/notifications':      <Bell size={26} strokeWidth={1.75} />,
  '/holidays':           <CalendarCheck size={26} strokeWidth={1.75} />,
  '/team/calendar':      <CalendarRange size={26} strokeWidth={1.75} />,
  '/team':               <Users size={26} strokeWidth={1.75} />,
  '/team/org-chart':     <Network size={26} strokeWidth={1.75} />,
  '/team/leave':         <CheckSquare size={26} strokeWidth={1.75} />,
  '/manage':             <Settings size={26} strokeWidth={1.75} />,
}

interface Worklet {
  label: string
  href: string
  badge?: number
}

export default function WorkletGrid({ worklets }: { worklets: Worklet[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '0.875rem',
      marginBottom: '1.5rem',
    }}>
      {worklets.map(w => (
        <Link key={w.href} href={w.href} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.125rem 1rem',
          minHeight: '96px',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between',
          textDecoration: 'none',
          boxShadow: 'var(--shadow)',
          position: 'relative',
          color: 'var(--primary)',
          transition: 'box-shadow 0.15s, transform 0.12s',
        }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.boxShadow = 'var(--shadow-md)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.boxShadow = 'var(--shadow)'
            el.style.transform = 'translateY(0)'
          }}
        >
          <span style={{ lineHeight: 1 }}>{ICON_MAP[w.href]}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }}>{w.label}</span>
            {w.badge && w.badge > 0 && (
              <span style={{
                background: '#f59e0b', color: '#fff', fontSize: '10px', fontWeight: 700,
                borderRadius: '999px', padding: '1px 6px', minWidth: '18px', textAlign: 'center',
              }}>{w.badge}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
