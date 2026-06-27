export default function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ maxWidth: '672px', margin: '0 auto' }}>
      <div style={{ height: '2rem', width: '200px', background: 'var(--surface2)', borderRadius: '0.5rem', marginBottom: '1.75rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1.125rem', padding: '1.25rem', boxShadow: 'var(--shadow)', animation: 'pulse 1.4s ease-in-out infinite' }}>
            <div style={{ height: '1rem', width: `${60 + (i % 3) * 15}%`, background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.5rem' }} />
            <div style={{ height: '0.75rem', width: '45%', background: 'var(--surface2)', borderRadius: '0.25rem' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
