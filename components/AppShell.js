'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (!stored) { router.push('/login'); return; }
    setRole(JSON.parse(stored).role);
  }, [router]);

  const nav = (path) => {
    if (path !== pathname) {
      startTransition(() => {
        router.push(path);
      });
    }
  };

  const logout = () => {
    sessionStorage.removeItem('tolun_user');
    router.push('/login');
  };

  return (
    <div>
      <LoadingOverlay show={isPending} message="Loading..." />
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6"
        style={{ background: 'var(--black)', height: 56, boxShadow: '0 2px 10px rgba(0,0,0,.15)' }}
      >
        <h1 onClick={() => nav('/dashboard')} className="text-white text-base font-semibold tracking-wide cursor-pointer">Tolun Logistics</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: 'var(--latte)', color: 'white' }}>{role}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-white text-sm font-medium hover:opacity-80 transition-opacity">
            <span className="material-icons-outlined" style={{ fontSize: 20 }}>logout</span>
            Logout
          </button>
        </div>
      </div>
      <div style={{ marginTop: 56, padding: 24, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
