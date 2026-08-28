export default function Loading() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ height: '1rem', width: '120px', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.75rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: '1.5rem', width: '260px', background: 'var(--surface2)', borderRadius: '0.375rem', marginBottom: '0.375rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.875rem', padding: '1.5rem', boxShadow: 'var(--shadow)' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ marginBottom: i < 3 ? '1rem' : 0 }}>
            <div style={{ height: '0.75rem', width: '30%', background: 'var(--surface2)', borderRadius: '0.25rem', marginBottom: '0.5rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ height: '1rem', width: '80%', background: 'var(--surface2)', borderRadius: '0.25rem', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
