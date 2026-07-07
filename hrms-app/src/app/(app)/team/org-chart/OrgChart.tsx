'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: string
  department_id: string | null
  manager_id: string | null
  email: string
  employee_type?: string
  is_active?: boolean
  departments?: { name: string } | null
}

interface TreeNode extends User {
  children: TreeNode[]
}

function buildTree(users: User[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  users.forEach(u => map.set(u.id, { ...u, children: [] }))
  const roots: TreeNode[] = []
  map.forEach(node => {
    if (!node.manager_id || !map.has(node.manager_id)) roots.push(node)
    else map.get(node.manager_id)!.children.push(node)
  })
  return roots
}

function collectConnections(nodes: TreeNode[]): Array<{ parentId: string; childId: string }> {
  const out: Array<{ parentId: string; childId: string }> = []
  function walk(node: TreeNode) {
    for (const child of node.children) { out.push({ parentId: node.id, childId: child.id }); walk(child) }
  }
  nodes.forEach(walk)
  return out
}

const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  super_admin:     { bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' },
  sub_super_admin: { bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
  admin:           { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  employee:        { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
}

function roleLabel(role: string) {
  return role === 'super_admin' ? 'Super Admin'
    : role === 'sub_super_admin' ? 'Sub Super Admin'
    : role === 'admin' ? 'Admin' : 'Employee'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Mobile: vertical indented list ───────────────────────────────────────────

function MobileNode({ node, depth, onSelect }: { node: TreeNode; depth: number; onSelect: (u: User) => void }) {
  const [collapsed, setCollapsed] = useState(depth > 1)
  const rc = ROLE_COLORS[node.role] ?? ROLE_COLORS.employee
  const hasChildren = node.children.length > 0

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : '1.25rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.625rem 0.75rem',
        borderLeft: depth > 0 ? `2px solid ${rc.border}` : 'none',
        marginBottom: '0.375rem',
        position: 'relative',
      }}>
        {/* Avatar */}
        <div
          onClick={() => onSelect(node)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
            background: rc.bg, color: rc.color, border: `2px solid ${rc.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '13px', cursor: 'pointer',
          }}
        >
          {initials(node.name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onSelect(node)}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
            <span style={{
              background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
              borderRadius: '999px', padding: '0.05rem 0.45rem',
              fontSize: '0.65rem', fontWeight: 600,
            }}>{roleLabel(node.role)}</span>
            {node.departments && (
              <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
                {(node.departments as { name: string }).name}
              </span>
            )}
          </div>
        </div>

        {/* Toggle */}
        {hasChildren && (
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: rc.bg, border: `1px solid ${rc.border}`,
              borderRadius: '0.375rem', padding: '0.25rem 0.5rem',
              color: rc.color, fontSize: '0.7rem', fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            {collapsed ? `+${node.children.length}` : '−'}
          </button>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div>
          {node.children.map(child => (
            <MobileNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Desktop: horizontal tree with SVG connectors ─────────────────────────────

function DesktopNode({ node, depth, onSelect, onToggle }: {
  node: TreeNode; depth: number; onSelect: (u: User) => void; onToggle: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const rc = ROLE_COLORS[node.role] ?? ROLE_COLORS.employee
  const hasChildren = node.children.length > 0

  function toggle() { setCollapsed(c => !c); requestAnimationFrame(onToggle) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        data-nodeid={node.id}
        onClick={() => onSelect(node)}
        style={{
          background: 'var(--surface)', border: `2px solid ${rc.border}`,
          borderRadius: '0.875rem', padding: '0.875rem 1rem',
          minWidth: '160px', maxWidth: '200px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer',
          position: 'relative', transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = `0 4px 16px ${rc.border}90`; el.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; el.style.transform = 'translateY(0)' }}
      >
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: rc.bg, color: rc.color, border: `2px solid ${rc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', margin: '0 auto 0.5rem',
        }}>{initials(node.name)}</div>
        <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>{node.name}</p>
        <span style={{
          display: 'inline-block', marginTop: '0.35rem',
          background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
          borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.65rem', fontWeight: 600,
        }}>{roleLabel(node.role)}</span>
        {node.departments && (
          <p style={{ color: 'var(--muted)', fontSize: '0.68rem', margin: '0.25rem 0 0' }}>
            {(node.departments as { name: string }).name}
          </p>
        )}
        {hasChildren && (
          <button
            onClick={e => { e.stopPropagation(); toggle() }}
            style={{
              position: 'absolute', bottom: '-13px', left: '50%', transform: 'translateX(-50%)',
              width: '22px', height: '22px', borderRadius: '50%',
              background: rc.bg, border: `2px solid ${rc.border}`,
              color: rc.color, fontSize: '11px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
            }}
          >{collapsed ? '+' : '−'}</button>
        )}
      </div>
      {hasChildren && (
        <div style={{ display: collapsed ? 'none' : 'flex', gap: '2rem', alignItems: 'flex-start', marginTop: '40px' }}>
          {node.children.map(child => (
            <DesktopNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Detail panel (shared) ────────────────────────────────────────────────────

function DetailPanel({ user, onClose }: { user: User; onClose: () => void }) {
  const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.employee
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '320px', maxWidth: '90vw',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        zIndex: 101, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', overflowY: 'auto',
      }}>
        <div style={{ background: `linear-gradient(135deg, ${rc.border}, ${rc.bg})`, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.8)', color: rc.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '18px', border: `2px solid ${rc.border}`, flexShrink: 0,
            }}>{initials(user.name)}</div>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: rc.color, margin: 0 }}>{user.name}</p>
              <span style={{ display: 'inline-block', marginTop: '0.25rem', background: 'rgba(255,255,255,0.7)', color: rc.color, borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>{roleLabel(user.role)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: rc.color, lineHeight: 1, padding: '0.25rem' }}>✕</button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: 'Email', value: user.email },
            { label: 'Department', value: user.departments ? (user.departments as { name: string }).name : 'Not assigned' },
            { label: 'Employee Type', value: user.employee_type ? user.employee_type.replace('_', ' ') : '—' },
            { label: 'Status', value: user.is_active !== false ? 'Active' : 'Inactive' },
          ].map(row => (
            <div key={row.label} style={{ background: 'var(--surface2)', borderRadius: '0.625rem', padding: '0.625rem 0.875rem' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.2rem' }}>{row.label}</p>
              <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.875rem', margin: 0, textTransform: 'capitalize' }}>{row.value}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 1.25rem 1.25rem', marginTop: 'auto' }}>
          <Link href={`/manage/employees/${user.id}/view`} style={{ display: 'block', textAlign: 'center', background: 'var(--primary)', color: '#fff', borderRadius: '0.75rem', padding: '0.75rem', fontWeight: 600, fontSize: '0.875rem' }}>
            View Full Profile
          </Link>
        </div>
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function OrgChart({ users }: { users: User[] }) {
  const roots = useMemo(() => buildTree(users), [users])
  const connections = useMemo(() => collectConnections(roots), [roots])
  const [selected, setSelected] = useState<User | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // SVG measurement for desktop
  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const cr = container.getBoundingClientRect()
    const newLines: typeof lines = []
    for (const { parentId, childId } of connections) {
      const pEl = container.querySelector(`[data-nodeid="${parentId}"]`)
      const cEl = container.querySelector(`[data-nodeid="${childId}"]`)
      if (!pEl || !cEl) continue
      const pr = pEl.getBoundingClientRect()
      const ch = cEl.getBoundingClientRect()
      if (ch.width === 0 && ch.height === 0) continue
      newLines.push({
        x1: pr.left - cr.left + pr.width / 2,
        y1: pr.bottom - cr.top,
        x2: ch.left - cr.left + ch.width / 2,
        y2: ch.top - cr.top,
      })
    }
    setLines(newLines)
  }, [connections])

  useEffect(() => {
    if (isMobile) return
    measure()
    window.addEventListener('resize', measure)
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { window.removeEventListener('resize', measure); ro.disconnect() }
  }, [measure, isMobile])

  const legend = (
    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
      {Object.entries(ROLE_COLORS).map(([role, c]) => (
        <span key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: c.bg, border: `1px solid ${c.border}`, display: 'inline-block' }} />
          {roleLabel(role)}
        </span>
      ))}
    </div>
  )

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {roots.map(root => (
            <MobileNode key={root.id} node={root} depth={0} onSelect={setSelected} />
          ))}
        </div>
        {legend}
        {selected && <DetailPanel user={selected} onClose={() => setSelected(null)} />}
      </>
    )
  }

  // ── Desktop layout ──
  return (
    <>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <div ref={containerRef} style={{ position: 'relative', padding: '2rem', width: 'max-content', minWidth: '100%' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
            {lines.map((l, i) => {
              const midY = (l.y1 + l.y2) / 2
              return (
                <g key={i}>
                  <line x1={l.x1} y1={l.y1} x2={l.x1} y2={midY} stroke="var(--border)" strokeWidth={2} />
                  <line x1={l.x1} y1={midY} x2={l.x2} y2={midY} stroke="var(--border)" strokeWidth={2} />
                  <line x1={l.x2} y1={midY} x2={l.x2} y2={l.y2} stroke="var(--border)" strokeWidth={2} />
                </g>
              )
            })}
          </svg>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '3rem', justifyContent: 'center' }}>
            {roots.map(root => (
              <DesktopNode key={root.id} node={root} depth={0} onSelect={setSelected} onToggle={measure} />
            ))}
          </div>
          {legend}
        </div>
      </div>
      {selected && <DetailPanel user={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
