export default function Loading() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Hero skeleton */}
      <div style={{
        background: 'linear-gradient(135deg, #5b1fa8, #7c2fc9)',
        borderRadius: '0.75rem', padding: '1.75rem 1.5rem', marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ height: '1.75rem', width: '240px', background: 'rgba(255,255,255,0.2)', borderRadius: '0.5rem', marginBottom: '0.5rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: '1rem', width: '160px', background: 'rgba(255,255,255,0.15)', borderRadius: '0.375rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>

      {/* Worklets skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.125rem 1rem', minHeight: '96px',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ height: '28px', width: '28px', background: 'var(--surface2)', borderRadius: '0.375rem', marginBottom: '0.75rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: '0.75rem', width: '80%', background: 'var(--surface2)', borderRadius: '0.25rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1.125rem', boxShadow: 'var(--shadow)',
          }}>
            <div style={{ height: '0.7rem', width: '70px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.5rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: '1.75rem', width: '50px', background: 'var(--surface2)', borderRadius: '0.375rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
