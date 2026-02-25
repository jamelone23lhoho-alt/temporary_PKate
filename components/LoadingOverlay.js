'use client';

export default function LoadingOverlay({ show, message }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, border: '3.5px solid var(--border)',
        borderTopColor: 'var(--latte)', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
        {message || 'Loading...'}
      </span>
    </div>
  );
}
