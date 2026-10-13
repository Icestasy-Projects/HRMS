export default function Loading() {
  const shimmer = { animation: 'pulse 1.4s ease-in-out infinite' }
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: '0.75rem', width: '140px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.75rem', ...shimmer }} />
        <div style={{ height: '1.5rem', width: '280px', background: 'var(--surface2)', borderRadius: '0.375rem', marginBottom: '0.375rem', ...shimmer }} />
        <div style={{ height: '0.75rem', width: '220px', background: 'var(--surface2)', borderRadius: '0.25rem', ...shimmer }} />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: '2rem', width: '5.5rem', background: 'var(--surface2)', borderRadius: '0.5rem', ...shimmer }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '1rem', padding: '1rem 1.25rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ height: '0.9rem', width: '120px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.375rem', ...shimmer }} />
                <div style={{ height: '0.6rem', width: '80px', background: 'var(--surface2)', borderRadius: '0.25rem', ...shimmer }} />
              </div>
              <div style={{ height: '1.25rem', width: '4.5rem', background: 'var(--surface2)', borderRadius: '999px', ...shimmer }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <div style={{ height: '3.5rem', background: 'var(--surface2)', borderRadius: '0.625rem', ...shimmer }} />
              <div style={{ height: '3.5rem', background: 'var(--surface2)', borderRadius: '0.625rem', ...shimmer }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
