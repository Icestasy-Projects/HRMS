export default function Loading() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ height: '2rem', width: '260px', background: 'var(--surface2)', borderRadius: '0.5rem', marginBottom: '0.5rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: '1rem', width: '180px', background: 'var(--surface2)', borderRadius: '0.375rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
      <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1.75rem' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1.125rem', padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
            <div style={{ height: '0.75rem', width: '80px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.75rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: '2rem', width: '60px', background: 'var(--surface2)', borderRadius: '0.375rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1.125rem', padding: '1.25rem', boxShadow: 'var(--shadow)' }}>
        <div style={{ height: '0.875rem', width: '100px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '1rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '44px', width: '130px', background: 'var(--surface2)', borderRadius: '0.75rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
