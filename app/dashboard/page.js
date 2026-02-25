'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DatePicker from '@/components/DatePicker';
import LoadingOverlay from '@/components/LoadingOverlay';
import { hasPermission } from '@/lib/permissions';

const fmt = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function DashboardPage() {
  const [totalTHB, setTotalTHB] = useState(0);
  const [totalMNT, setTotalMNT] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [client, setClient] = useState('');
  const [clients, setClients] = useState([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
    loadClients();
  }, []);

  useEffect(() => { loadDash(); }, [dateFrom, dateTo, client]);

  const loadClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
  };

  const loadDash = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (client) params.set('client', client);
    const res = await fetch(`/api/dashboard?${params}`);
    const data = await res.json();
    setTotalTHB(data.totalTHB || 0);
    setTotalMNT(data.totalMNT || 0);
    setLoading(false);
  };

  const resetFilter = () => { setDateFrom(''); setDateTo(''); setClient(''); };

  const quickItems = [
    { label: 'Export', icon: 'local_shipping', path: '/export', perm: 'export_view' },
    { label: 'Export Form', icon: 'receipt_long', path: '/export-form', perm: 'export_view' },
    { label: 'Client', icon: 'people', path: '/client', perm: 'client_view' },
    { label: 'Note', icon: 'description', path: '/note', perm: 'note_view' },
    { label: 'Users', icon: 'admin_panel_settings', path: '/users', perm: 'users_view' },
  ];

  const cardStyle = { padding: 24, borderRadius: 12, borderLeft: '4px solid', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

  return (
    <AppShell>
      <LoadingOverlay show={loading} />
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>From</span>
            <div style={{ width: 160 }}><DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Start date" /></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>To</span>
            <div style={{ width: 160 }}><DatePicker value={dateTo} onChange={setDateTo} placeholder="End date" /></div>
          </div>
          <select value={client} onChange={(e) => setClient(e.target.value)} className="px-3.5 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1.5px solid var(--border)', background: 'white' }}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={resetFilter} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:-translate-y-0.5" style={{ background: 'var(--latte)', color: 'white' }}>All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div style={{ ...cardStyle, borderColor: 'var(--info)', background: 'white' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--info)' }}>Total Sales (THB)</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--black)' }}>{fmt(totalTHB)}</div>
          </div>
          <div style={{ ...cardStyle, borderColor: 'var(--danger)', background: 'white' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--danger)' }}>Total Sales (MNT)</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--black)' }}>{fmt(totalMNT)}</div>
          </div>
        </div>

        <h3 className="text-base font-bold mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {quickItems.map(item => (
            hasPermission(role, item.perm) && (
              <div key={item.label} onClick={() => router.push(item.path)} className="rounded-xl p-6 text-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md" style={{ background: 'white', border: '1.5px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div className="rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--beige)', width: 52, height: 52, color: 'var(--accent)' }}>
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
