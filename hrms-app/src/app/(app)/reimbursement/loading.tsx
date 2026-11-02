export default function ReimbursementLoading() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div className="reimb-skel" style={{ width: '160px', height: '12px', borderRadius: '4px', marginBottom: '0.5rem' }} />
        <div className="reimb-skel" style={{ width: '200px', height: '28px', borderRadius: '6px' }} />
      </div>

      {/* New Claim button */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="reimb-skel" style={{ width: '180px', height: '44px', borderRadius: '0.5rem' }} />
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: '1 1 140px', minWidth: 0,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '1rem 1.125rem',
          }}>
            <div className="reimb-skel" style={{ width: '60px', height: '10px', borderRadius: '3px', marginBottom: '0.5rem' }} />
            <div className="reimb-skel" style={{ width: '100px', height: '22px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.25rem',
        background: 'var(--surface2, var(--bg))', borderRadius: '0.625rem',
        padding: '0.25rem', border: '1px solid var(--border)',
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="reimb-skel" style={{ flex: 1, height: '40px', borderRadius: '0.5rem' }} />
        ))}
      </div>

      {/* Batch cards */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '0.875rem 1.125rem', marginBottom: '0.625rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div className="reimb-skel" style={{ width: '120px', height: '14px', borderRadius: '4px', marginBottom: '0.4rem' }} />
            <div className="reimb-skel" style={{ width: '80px', height: '12px', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <div className="reimb-skel" style={{ width: '80px', height: '16px', borderRadius: '4px' }} />
            <div className="reimb-skel" style={{ width: '60px', height: '22px', borderRadius: '999px' }} />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes reimbShimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
        .reimb-skel {
          background: var(--border);
          animation: reimbShimmer 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
