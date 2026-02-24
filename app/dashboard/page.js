'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { hasPermission } from '@/lib/permissions';

export default function DashboardPage() {
  const [totalTHB, setTotalTHB] = useState(0);
  const [totalMNT, setTotalMNT] = useState(0);
  const [filterType, setFilterType] = useState('Month');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await fetch(`/api/dashboard?type=${filterType}&date=${filterDate}`);
    const data = await res.json();
    setTotalTHB(data.totalTHB || 0);
    setTotalMNT(data.totalMNT || 0);
  };

  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const quickItems = [
    { label: 'Export', icon: 'local_shipping', path: '/export', perm: 'export_view' },
    { label: 'Client', icon: 'people', path: '/client', perm: 'client_view' },
    { label: 'Note', icon: 'description', path: '/note', perm: 'note_view' },
    { label: 'Users', icon: 'admin_panel_settings', path: '/users', perm: 'users_view' },
  ];

  return (
    <AppShell>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1.5px solid var(--border)', background: 'var(--white)' }}
          >
            <option value="Month">Month</option>
            <option value="Day">Day</option>
            <option value="Year">Year</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm outline-none"
            style={{ border: '1.5px solid var(--border)', background: 'var(--white)' }}
          />
          <button
            onClick={loadDashboard}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--black)' }}
          >
            Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-xl border-l-4" style={{ background: 'var(--info-light)', borderColor: 'var(--info)' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--info)' }}>Total Sales (THB)</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--black)' }}>{fmt(totalTHB)}</div>
          </div>
          <div className="p-6 rounded-xl border-l-4" style={{ background: 'var(--danger-light)', borderColor: 'var(--danger)' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--danger)' }}>Total Sales (MNT)</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--black)' }}>{fmt(totalMNT)}</div>
          </div>
        </div>

        <h3 className="text-base font-bold mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {quickItems.map(item => (
            hasPermission(role, item.perm) && (
              <div
                key={item.label}
                onClick={() => router.push(item.path)}
                className="bg-white rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                style={{ border: '1.5px solid var(--border)' }}
              >
                <div
                  className="w-13 h-13 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--beige)', width: 52, height: 52, color: 'var(--accent)' }}
                >
                  <span className="material-icons-outlined" style={{ fontSize: 24 }}>{item.icon}</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </AppShell>
  );
}
