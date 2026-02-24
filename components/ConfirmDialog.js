'use client';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
    >
      <div className="bg-white rounded-xl p-8 max-w-sm text-center shadow-xl modal-animate">
        <h4 className="text-base font-bold mb-2">{title}</h4>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'var(--danger)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
