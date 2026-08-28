export default function Loading() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: '1rem', width: '120px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.75rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: '1.5rem', width: '240px', background: 'var(--surface2)', borderRadius: '0.375rem', marginBottom: '0.375rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: '0.875rem', width: '180px', background: 'var(--surface2)', borderRadius: '0.25rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1rem 1.25rem', marginBottom: '0.625rem', boxShadow: 'var(--shadow)' }}>
          <div style={{ height: '0.95rem', width: '60%', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.4rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: '0.82rem', width: '40%', background: 'var(--surface2)', borderRadius: '0.25rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
