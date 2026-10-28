export default function ReimbursementLoading() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ width: '160px', height: '12px', background: 'var(--border)', borderRadius: '4px', marginBottom: '0.5rem' }} />
        <div style={{ width: '200px', height: '28px', background: 'var(--border)', borderRadius: '6px' }} />
      </div>
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ width: '180px', height: '44px', background: 'var(--border)', borderRadius: '0.5rem' }} />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '0.75rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ width: '120px', height: '14px', background: 'var(--border)', borderRadius: '4px', marginBottom: '0.4rem' }} />
            <div style={{ width: '80px', height: '12px', background: 'var(--border)', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '16px', background: 'var(--border)', borderRadius: '4px' }} />
            <div style={{ width: '60px', height: '22px', background: 'var(--border)', borderRadius: '999px' }} />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes reimbShimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        div[style*="background: var(--border)"] {
          animation: reimbShimmer 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
