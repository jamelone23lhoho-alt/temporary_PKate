'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard', perm: 'dashboard' },
  { key: 'export', label: 'Export', icon: 'local_shipping', path: '/export', perm: 'export_view' },
  { key: 'client', label: 'Client', icon: 'people', path: '/client', perm: 'client_view' },
  { key: 'note', label: 'Note', icon: 'description', path: '/note', perm: 'note_view' },
  { key: 'users', label: 'Users', icon: 'admin_panel_settings', path: '/users', perm: 'users_view' },
];

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (!stored) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('tolun_user');
    router.push('/login');
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  const role = user.role;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
        style={{ background: 'var(--black)', height: 56, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            <span className="material-icons-outlined" style={{ fontSize: 24 }}>menu</span>
          </button>
          <h1 className="text-white text-base font-semibold tracking-wide">Tolun Logistics</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full text-white" style={{ background: 'var(--latte)' }}>{role}</span>
          <button onClick={handleLogout} className="text-white">
            <span className="material-icons-outlined" style={{ fontSize: 22 }}>logout</span>
          </button>
        </div>
      </div>

      <div
        className="fixed top-14 z-40 h-[calc(100vh-56px)] overflow-y-auto transition-all duration-300 bg-white border-r"
        style={{
          width: 260,
          left: sidebarOpen ? 0 : -260,
          borderColor: 'var(--border)',
        }}
      >
        <div className="py-6">
          <div className="px-6 mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Main</div>
          {NAV_ITEMS.slice(0, 1).map(item => (
            hasPermission(role, item.perm) && (
              <div
                key={item.key}
                onClick={() => { router.push(item.path); setSidebarOpen(false); }}
                className="flex items-center gap-3.5 px-6 py-3 cursor-pointer transition-all text-sm font-medium"
                style={{
                  background: pathname === item.path ? 'var(--beige)' : 'transparent',
                  color: pathname === item.path ? 'var(--black)' : 'var(--text-secondary)',
                  fontWeight: pathname === item.path ? 600 : 500,
                }}
              >
                <span className="material-icons-outlined" style={{ fontSize: 22 }}>{item.icon}</span>
                {item.label}
              </div>
            )
          ))}

          <div className="mx-6 my-3 h-px" style={{ background: 'var(--border)' }} />
          <div className="px-6 mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Management</div>
          {NAV_ITEMS.slice(1, 4).map(item => (
            hasPermission(role, item.perm) && (
              <div
                key={item.key}
                onClick={() => { router.push(item.path); setSidebarOpen(false); }}
                className="flex items-center gap-3.5 px-6 py-3 cursor-pointer transition-all text-sm font-medium"
                style={{
                  background: pathname === item.path ? 'var(--beige)' : 'transparent',
                  color: pathname === item.path ? 'var(--black)' : 'var(--text-secondary)',
                  fontWeight: pathname === item.path ? 600 : 500,
                }}
              >
                <span className="material-icons-outlined" style={{ fontSize: 22 }}>{item.icon}</span>
                {item.label}
              </div>
            )
          ))}

          {hasPermission(role, 'users_view') && (
            <>
              <div className="mx-6 my-3 h-px" style={{ background: 'var(--border)' }} />
              <div className="px-6 mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>System</div>
              <div
                onClick={() => { router.push('/users'); setSidebarOpen(false); }}
                className="flex items-center gap-3.5 px-6 py-3 cursor-pointer transition-all text-sm font-medium"
                style={{
                  background: pathname === '/users' ? 'var(--beige)' : 'transparent',
                  color: pathname === '/users' ? 'var(--black)' : 'var(--text-secondary)',
                  fontWeight: pathname === '/users' ? 600 : 500,
                }}
              >
                <span className="material-icons-outlined" style={{ fontSize: 22 }}>admin_panel_settings</span>
                Users
              </div>
            </>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ top: 56, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="pt-14">
        <div className="max-w-[1200px] mx-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
