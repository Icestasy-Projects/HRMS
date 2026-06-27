import Link from 'next/link'

interface Crumb { label: string; href?: string }

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {i > 0 && <span style={{ opacity: 0.5 }}>/</span>}
          {c.href ? (
            <Link href={c.href} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>{c.label}</Link>
          ) : (
            <span>{c.label}</span>
          )}
        </span>
      ))}
    </p>
  )
}
