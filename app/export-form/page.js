'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { hasPermission } from '@/lib/permissions';
import { printInvoicePDF } from '@/components/PrintPDF';

const TYPE_BOXES = ['Personal','Special1','Special2','Special3'];

function F({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all";
const inputStyle = { border: '1.5px solid var(--border)' };
const readonlyStyle = { ...inputStyle, background: 'var(--cream)', color: 'var(--text-muted)' };
const fmt = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (d) => { if (!d) return '-'; const dt = new Date(d); return isNaN(dt) ? d : `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`; };

export default function ExportFormPage() {
  const [forms, setForms] = useState([]);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectExportOpen, setSelectExportOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({});
  const [exportSearch, setExportSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/export-forms?search=${search}`);
    const data = await res.json();
    setForms(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadExports = async () => {
    const res = await fetch('/api/exports');
    const data = await res.json();
    setExports(Array.isArray(data) ? data : []);
  };

  const calcTotal = (f) => {
    const ppk = parseFloat(f.price_per_kg) || 0;
    const wr = parseFloat(f.weight_result) || 0;
    const ppd = parseFloat(f.price_per_diff) || 0;
    const wd = parseFloat(f.weight_diff) || 0;
    return (ppk * wr + ppd * wd).toFixed(2);
  };

  const openSelectExport = () => {
    loadExports();
    setExportSearch('');
    setSelectExportOpen(true);
  };

  const selectExport = (exp) => {
    const totalWr = 0;
    setSelectExportOpen(false);
    openFormWithExport(exp);
  };

  const openFormWithExport = async (exp) => {
    const boxRes = await fetch(`/api/boxes?export_id=${exp.id}`);
    const boxData = await boxRes.json();
    const bxs = Array.isArray(boxData) ? boxData : [];
    const wr = bxs.reduce((s, b) => s + (parseFloat(b.weight_result) || 0), 0);

    setEditing(null);
    setForm({
      export_id: exp.id,
      export_date: exp.export_date || '',
      order_code: exp.order_code || '',
      client: exp.client || '',
      total_boxes: exp.total_boxs || bxs.length,
      total_gw: exp.total_gw || 0,
      weight_result: wr || 0,
      weight_diff: '',
      price_per_kg: '',
      price_per_diff: '',
      total_thb: '',
      total_mnt: '',
      type_box: 'Personal',
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      export_id: row.export_id || '',
      export_date: row.export_date || '',
      order_code: row.order_code || '',
      client: row.client || '',
      total_boxes: row.total_boxes || 0,
      total_gw: row.total_gw || 0,
      weight_result: row.weight_result || 0,
      weight_diff: row.weight_diff || '',
      price_per_kg: row.price_per_kg || '',
      price_per_diff: row.price_per_diff || '',
      total_thb: row.total_thb || '',
      total_mnt: row.total_mnt || '',
      type_box: row.type_box || 'Personal',
    });
    setDetailOpen(false);
    setModalOpen(true);
  };

  const updateFormField = (key, val) => {
    const newForm = { ...form, [key]: val };
    if (['price_per_kg','weight_result','price_per_diff','weight_diff'].includes(key)) {
      newForm.total_thb = calcTotal(newForm);
    }
    setForm(newForm);
  };

  const handleSave = async () => {
    const body = { ...form, total_thb: calcTotal(form) };
    if (editing) {
      await fetch('/api/export-forms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) });
      setToast({ msg: 'Updated', type: 'success' });
    } else {
      await fetch('/api/export-forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setToast({ msg: 'Saved', type: 'success' });
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await fetch(`/api/export-forms?id=${current.id}`, { method: 'DELETE' });
    setToast({ msg: 'Deleted', type: 'success' });
    setConfirmOpen(false);
    setDetailOpen(false);
    loadData();
  };

  const filteredExports = exports.filter(e =>
    (e.order_code || '').toLowerCase().includes(exportSearch.toLowerCase()) ||
    (e.client || '').toLowerCase().includes(exportSearch.toLowerCase())
  );

  return (
    <AppShell>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="w-9 h-9 rounded-full border flex items-center justify-center bg-white" style={{ borderColor: 'var(--border)' }}>
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            Export Form
          </h2>
          {hasPermission(role, 'export_add') && (
            <button onClick={openSelectExport} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'var(--black)' }}>
              + Add
            </button>
          )}
        </div>

        <div className="relative mb-5">
          <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', fontSize: 20 }}>search</span>
          <input type="text" placeholder="Search order code, client..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-11`} style={{ ...inputStyle, background: 'var(--white)' }} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16" style={{ color: 'var(--text-muted)' }}><div className="spinner" /><span className="text-sm mt-3">Loading...</span></div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <span className="material-icons-outlined block mb-3" style={{ fontSize: 48, color: 'var(--grey)' }}>receipt_long</span>
            <p>No export forms found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <table className="w-full border-collapse rounded-xl overflow-hidden" style={{ background: 'white' }}>
              <thead>
                <tr>
                  {['Date','Order Code','Client','Boxes','WR','Total THB','Total MNT','Type','Invoice'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--cream)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forms.map(r => (
                  <tr key={r.id} className="cursor-pointer transition-all hover:bg-cream" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtD(r.export_date)}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--danger)' }}>{r.order_code}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.client || '-'}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.total_boxes || '-'}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>{r.weight_result || '-'}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>{r.total_thb ? fmt(r.total_thb) : '-'}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.total_mnt ? fmt(r.total_mnt) : '-'}</td>
                    <td onClick={() => { setCurrent(r); setDetailOpen(true); }} className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.type_box || '-'}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={(e) => { e.stopPropagation(); printInvoicePDF(r); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1" style={{ background: 'var(--info)', color: 'white' }}>
                        <span className="material-icons-outlined" style={{ fontSize: 14 }}>receipt</span>Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={selectExportOpen} onClose={() => setSelectExportOpen(false)} title="Select Export">
        <div className="relative mb-4">
          <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', fontSize: 20 }}>search</span>
          <input type="text" placeholder="Search export..." value={exportSearch} onChange={(e) => setExportSearch(e.target.value)} className={`${inputCls} pl-11`} style={inputStyle} />
        </div>
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          {filteredExports.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No exports found</div>
          ) : (
            filteredExports.map(exp => (
              <div key={exp.id} onClick={() => selectExport(exp)} className="p-3 rounded-lg mb-2 cursor-pointer transition-all hover:shadow-sm" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>{exp.order_code}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtD(exp.export_date)}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{exp.client} — {exp.total_boxs || 0} boxes</div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Export Form Detail" footer={
        hasPermission(role, 'export_add') && current && <>
          <button onClick={() => printInvoicePDF(current)} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ background: 'var(--info)', color: 'white' }}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>receipt</span>Invoice
          </button>
          <button onClick={() => openEdit(current)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Edit</button>
          <button onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--danger)' }}>Delete</button>
        </>
      }>
        {current && (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Order Code', current.order_code, 'var(--danger)'],
                ['Client', current.client],
                ['Export Date', fmtD(current.export_date)],
                ['Total Boxes', current.total_boxes],
                ['Total GW', fmt(current.total_gw) + ' kg'],
                ['Weight Result', fmt(current.weight_result) + ' kg'],
                ['Weight Diff', fmt(current.weight_diff) + ' kg'],
                ['Price/kg', fmt(current.price_per_kg)],
                ['Price/diff', fmt(current.price_per_diff)],
                ['Type Box', current.type_box],
              ].map(([l, v, c]) => (
                <div key={l} className="mb-1">
                  <div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</div>
                  <div className="text-sm font-medium" style={c ? { color: c, fontWeight: 600 } : {}}>{v || '-'}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--success)' }}>Total THB</span>
                <span className="text-lg font-bold" style={{ color: 'var(--danger)' }}>฿ {fmt(current.total_thb)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: 'var(--info)' }}>Total MNT</span>
                <span className="text-lg font-bold" style={{ color: 'var(--info)' }}>₮ {fmt(current.total_mnt)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Export Form' : 'New Export Form'} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--latte)' }}>Save</button>
        </>
      }>
        <div className="text-xs font-bold uppercase tracking-wider mb-3 pb-2" style={{ color: 'var(--danger)', borderBottom: '1px solid var(--border)' }}>From Export (Read-only)</div>
        <div className="grid grid-cols-2 gap-3 mb-2">
          <F label="Export Date"><input value={form.export_date || ''} readOnly className={inputCls} style={readonlyStyle} /></F>
          <F label="Order Code"><input value={form.order_code || ''} readOnly className={inputCls} style={readonlyStyle} /></F>
        </div>
        <F label="Client"><input value={form.client || ''} readOnly className={inputCls} style={readonlyStyle} /></F>
        <div className="grid grid-cols-3 gap-3">
          <F label="Total Boxes"><input value={form.total_boxes || 0} readOnly className={inputCls} style={readonlyStyle} /></F>
          <F label="Total GW"><input value={form.total_gw || 0} readOnly className={inputCls} style={readonlyStyle} /></F>
          <F label="Weight Result"><input value={form.weight_result || 0} readOnly className={inputCls} style={readonlyStyle} /></F>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider mt-4 mb-3 pb-2" style={{ color: 'var(--success)', borderBottom: '1px solid var(--border)' }}>Pricing</div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Weight Difference"><input type="number" step="0.01" value={form.weight_diff} onChange={(e) => updateFormField('weight_diff', e.target.value)} className={inputCls} style={inputStyle} /></F>
          <F label="Price per kg"><input type="number" step="0.01" value={form.price_per_kg} onChange={(e) => updateFormField('price_per_kg', e.target.value)} className={inputCls} style={inputStyle} /></F>
        </div>
        <F label="Price per diff"><input type="number" step="0.01" value={form.price_per_diff} onChange={(e) => updateFormField('price_per_diff', e.target.value)} className={inputCls} style={inputStyle} /></F>
        <F label="Total THB (auto)"><input value={calcTotal(form)} readOnly className={inputCls} style={readonlyStyle} /></F>
        <F label="Total MNT"><input type="number" step="0.01" value={form.total_mnt} onChange={(e) => setForm({...form, total_mnt: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Type Box">
          <select value={form.type_box} onChange={(e) => setForm({...form, type_box: e.target.value})} className={inputCls} style={inputStyle}>
            {TYPE_BOXES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </F>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} title="Delete Export Form" message={`Delete form for ${current?.order_code}?`} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </AppShell>
  );
}
