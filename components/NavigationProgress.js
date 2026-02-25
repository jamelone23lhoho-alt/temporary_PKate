'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
        setLoading(true);
        return;
      }

      const clickables = e.composedPath();
      for (const el of clickables) {
        if (el.dataset && el.dataset.navlink) {
          setLoading(true);
          return;
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    window.history.pushState = function(...args) {
      setLoading(true);
      return origPush.apply(this, args);
    };
    window.history.replaceState = function(...args) {
      return origReplace.apply(this, args);
    };

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <div className="spinner" style={{ width: 44, height: 44 }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: '#6b6560' }}>Loading...</span>
    </div>
  );
}
