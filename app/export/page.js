'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { hasPermission } from '@/lib/permissions';

function F({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</label>
      {children}
    </div>
  );
}

export default function ExportPage() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [clients, setClients] = useState([]);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({});
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/exports?search=${search}`);
    const data = await res.json();
    setExports(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      client: role === 'Origin Officer' ? 'CTL000 (Unknown)' : '',
      export_date: new Date().toISOString().split('T')[0],
      mawb_no: '', item: '', sender: '', sender_phone: '',
      recipient: '', recipient_phone: '', remark: '',
      total_boxs: '', total_gw: '', bill_thb: '', bill_mnt: '',
      payment: 'No', box_type: '',
    });
    loadClients();
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      client: row.client || '',
      export_date: row.export_date || '',
      mawb_no: row.mawb_no || '',
      item: row.item || '',
      sender: row.sender || '',
      sender_phone: row.sender_phone || '',
      recipient: row.recipient || '',
      recipient_phone: row.recipient_phone || '',
      remark: row.remark || '',
      total_boxs: row.total_boxs || '',
      total_gw: row.total_gw || '',
      bill_thb: row.bill_thb || '',
      bill_mnt: row.bill_mnt || '',
      payment: row.payment || 'No',
      box_type: row.box_type || '',
    });
    loadClients();
    setDetailOpen(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.client) { setToast({ msg: 'Please select a client', type: 'error' }); return; }
    if (editing) {
      await fetch('/api/exports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      setToast({ msg: 'Export updated', type: 'success' });
    } else {
      await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setToast({ msg: 'Export saved', type: 'success' });
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await fetch(`/api/exports?id=${current.id}`, { method: 'DELETE' });
    setToast({ msg: 'Export deleted', type: 'success' });
    setConfirmOpen(false);
    setDetailOpen(false);
    loadData();
  };

  const fmt = (n) => {
    const v = parseFloat(n);
    return isNaN(v) ? '-' : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt) ? d : `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { border: '1.5px solid var(--border)' };

  return (
    <AppShell>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="w-9 h-9 rounded-full border flex items-center justify-center bg-white transition-all hover:bg-cream" style={{ borderColor: 'var(--border)' }}>
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            Export
          </h2>
          {hasPermission(role, 'export_add') && (
            <button onClick={openAdd} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'var(--black)' }}>
              + Add Export
            </button>
          )}
        </div>

        <div className="relative mb-5">
          <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', fontSize: 20 }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking, client, or status..."
            className={`${inputCls} pl-11`}
            style={{ ...inputStyle, background: 'var(--white)' }}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="spinner" /><div className="mt-3 text-sm">Loading data...</div>
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <span className="material-icons-outlined block mb-3" style={{ fontSize: 48, color: 'var(--grey)' }}>inventory_2</span>
            <p className="text-sm">No export records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
              <thead>
                <tr style={{ background: 'var(--cream)' }}>
                  {['Export Date','Order Code','Client','Total Boxs','Total GW.','Bill THB','Bill MNT','Payment','Box Type','Remark'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exports.map(row => (
                  <tr key={row.id} onClick={() => { setCurrent(row); setDetailOpen(true); }} className="cursor-pointer transition-all hover:bg-cream" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtDate(row.export_date)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--danger)' }}>{row.order_code}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.client || '-'}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.total_boxs || '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>{row.total_gw || '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>{row.bill_thb ? fmt(row.bill_thb) : '-'}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.bill_mnt ? fmt(row.bill_mnt) : '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold">{row.payment === 'Yes' ? <span style={{ color: 'var(--success)' }}>✓</span> : <span style={{ color: 'var(--danger)' }}>✕</span>}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.box_type || '-'}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Export Detail" footer={
        hasPermission(role, 'export_add') && current && <>
          <button onClick={() => openEdit(current)} className="px-4 py-2 rounded-lg text-sm font-semibold transition-all" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Edit</button>
          <button onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--danger)' }}>Delete</button>
        </>
      }>
        {current && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Order Code', current.order_code, true],
              ['Client', current.client],
              ['Export Date', fmtDate(current.export_date)],
              ['MAWB No', current.mawb_no],
              ['Item', current.item],
              ['Sender', current.sender],
              ['Sender Phone', current.sender_phone],
              ['Recipient', current.recipient],
              ['Recipient Phone', current.recipient_phone],
              ['Total Boxs', current.total_boxs],
              ['Total GW', current.total_gw],
              ['Bill THB', current.bill_thb ? fmt(current.bill_thb) : '-'],
              ['Bill MNT', current.bill_mnt ? fmt(current.bill_mnt) : '-'],
              ['Payment', current.payment],
              ['Box Type', current.box_type],
            ].map(([label, val, isCode]) => (
              <div key={label}>
                <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className={`text-sm font-medium ${isCode ? 'font-semibold' : ''}`} style={{ color: isCode ? 'var(--danger)' : 'var(--text-primary)' }}>{val || '-'}</div>
              </div>
            ))}
            <div className="col-span-2">
              <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Remark</div>
              <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{current.remark || '-'}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Export' : 'Exports Form'} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--latte)' }}>Save</button>
        </>
      }>
        {editing && <F label="Order Code"><input value={editing.order_code} readOnly className={`${inputCls}`} style={{ ...inputStyle, background: 'var(--cream)', color: 'var(--text-muted)' }} /></F>}
        <F label="Client *">
          {role === 'Origin Officer' ? (
            <input value="CTL000 (Unknown)" readOnly className={inputCls} style={{ ...inputStyle, background: 'var(--cream)' }} />
          ) : (
            <select value={form.client} onChange={(e) => setForm({...form, client: e.target.value})} className={inputCls} style={inputStyle}>
              <option value="">-- เลือกลูกค้า --</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
        </F>
        <F label="Export Date"><input type="date" value={form.export_date} onChange={(e) => setForm({...form, export_date: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="MAWB No"><input value={form.mawb_no} onChange={(e) => setForm({...form, mawb_no: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label={<span style={{ color: 'var(--success)' }}>Item</span>}><input value={form.item} onChange={(e) => setForm({...form, item: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Sender"><input value={form.sender} onChange={(e) => setForm({...form, sender: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Sender Phone"><input value={form.sender_phone} onChange={(e) => setForm({...form, sender_phone: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Recipient"><input value={form.recipient} onChange={(e) => setForm({...form, recipient: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Recipient Phone"><input value={form.recipient_phone} onChange={(e) => setForm({...form, recipient_phone: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Total Boxs"><input type="number" value={form.total_boxs} onChange={(e) => setForm({...form, total_boxs: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Total GW."><input type="number" step="0.01" value={form.total_gw} onChange={(e) => setForm({...form, total_gw: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Bill THB"><input type="number" step="0.01" value={form.bill_thb} onChange={(e) => setForm({...form, bill_thb: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Bill MNT"><input type="number" step="0.01" value={form.bill_mnt} onChange={(e) => setForm({...form, bill_mnt: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Payment">
          <select value={form.payment} onChange={(e) => setForm({...form, payment: e.target.value})} className={inputCls} style={inputStyle}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </F>
        <F label="Box Type"><input value={form.box_type} onChange={(e) => setForm({...form, box_type: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Remark"><textarea value={form.remark} onChange={(e) => setForm({...form, remark: e.target.value})} className={inputCls} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} /></F>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} title="Delete Export" message={`Are you sure you want to delete ${current?.order_code}?`} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
