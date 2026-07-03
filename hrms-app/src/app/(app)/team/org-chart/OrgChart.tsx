'use client'

import { useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  role: string
  department_id: string | null
  manager_id: string | null
  email: string
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
    if (!node.manager_id || !map.has(node.manager_id)) {
      roots.push(node)
    } else {
      map.get(node.manager_id)!.children.push(node)
    }
  })
  return roots
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

function OrgNode({ node, depth }: { node: TreeNode; depth: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const rc = ROLE_COLORS[node.role] ?? ROLE_COLORS.employee
  const hasChildren = node.children.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Card */}
      <div style={{ position: 'relative' }}>
        <div style={{
          background: 'var(--surface)',
          border: `2px solid ${rc.border}`,
          borderRadius: '0.875rem',
          padding: '0.875rem 1rem',
          minWidth: '160px',
          maxWidth: '200px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: rc.bg, color: rc.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '14px', margin: '0 auto 0.5rem',
            border: `2px solid ${rc.border}`,
          }}>
            {initials(node.name)}
          </div>
          <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)', margin: 0, lineHeight: 1.3 }}>{node.name}</p>
          <span style={{
            display: 'inline-block', marginTop: '0.35rem',
            background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
            borderRadius: '999px', padding: '0.1rem 0.5rem',
            fontSize: '0.65rem', fontWeight: 600,
          }}>
            {roleLabel(node.role)}
          </span>
          {node.departments && (
            <p style={{ color: 'var(--muted)', fontSize: '0.68rem', margin: '0.25rem 0 0' }}>
              {(node.departments as { name: string }).name}
            </p>
          )}
        </div>

        {/* Expand/collapse toggle */}
        {hasChildren && (
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)',
              width: '24px', height: '24px', borderRadius: '50%',
              background: rc.bg, border: `2px solid ${rc.border}`,
              color: rc.color, fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2, lineHeight: 1,
            }}
          >
            {collapsed ? '+' : '−'}
          </button>
        )}
      </div>

      {/* Connector line down */}
      {hasChildren && !collapsed && (
        <div style={{ width: '2px', height: '22px', background: 'var(--border)', flexShrink: 0 }} />
      )}

      {/* Children row */}
      {hasChildren && !collapsed && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', position: 'relative' }}>
          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <div style={{
              position: 'absolute', top: 0, left: '50%',
              height: '2px', background: 'var(--border)',
              width: `calc(100% - ${100 / node.children.length}%)`,
              transform: 'translateX(-50%)',
            }} />
          )}
          {node.children.map(child => (
            <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Connector line up to bar */}
              <div style={{ width: '2px', height: '20px', background: 'var(--border)' }} />
              <OrgNode node={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgChart({ users }: { users: User[] }) {
  const roots = buildTree(users)

  return (
    <div style={{ overflowX: 'auto', padding: '1rem 0 2rem' }}>
      <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', minWidth: 'max-content', padding: '0 2rem' }}>
        {roots.map(root => (
          <OrgNode key={root.id} node={root} depth={0} />
        ))}
      </div>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(ROLE_COLORS).map(([role, c]) => (
          <span key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: c.bg, border: `1px solid ${c.border}`, display: 'inline-block' }} />
            {roleLabel(role)}
          </span>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>· Click −/+ to collapse</span>
      </div>
    </div>
  )
}
