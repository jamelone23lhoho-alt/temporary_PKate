'use client';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import DatePicker from '@/components/DatePicker';
import LoadingOverlay from '@/components/LoadingOverlay';
import { hasPermission } from '@/lib/permissions';
import { printExportPDF, printInvoicePDF } from '@/components/PrintPDF';

const ITEM_TYPES = ['Everyday items','Medicine','electric equipment','clothes','food','Creamy liquid','Gel liquid','Water liquid','capsule','Powder','Water spray','balm liquid'];
const PHOTO_LABELS = {'received_package':'Received package','items_in_box':'Items in the box','box_and_weight':'Box and weight','other_1':'Other 1','other_2':'Other 2'};
const BOX_TYPES = ['Personal Box','Special Box'];

function F({ label, children }) {
  return (<div className="mb-4"><label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{label}</label>{children}</div>);
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all";
const inputStyle = { border: '1.5px solid var(--border)' };
const roStyle = { ...inputStyle, background: 'var(--cream)', color: 'var(--text-muted)' };
const fmt = (n) => (parseFloat(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = (d) => { if (!d) return '-'; const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; };

export default function ExportPage() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [boxes, setBoxes] = useState([]);
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [boxForm, setBoxForm] = useState({});
  const [boxItems, setBoxItems] = useState({ item: '', unit: '', type: '' });
  const [boxPhotos, setBoxPhotos] = useState({});
  const [editingBox, setEditingBox] = useState(null);
  const [boxDetailOpen, setBoxDetailOpen] = useState(false);
  const [currentBox, setCurrentBox] = useState(null);
  const [detailBoxes, setDetailBoxes] = useState([]);
  const [efModalOpen, setEfModalOpen] = useState(false);
  const [efForm, setEfForm] = useState({});
  const [efEditing, setEfEditing] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const goBack = () => { startTransition(() => { router.push('/dashboard'); }); };  useEffect(() => { const s = sessionStorage.getItem('tolun_user'); if (s) setRole(JSON.parse(s).role); }, []);

  const loadData = useCallback(async () => { setLoading(true); const res = await fetch(`/api/exports?search=${search}`); const data = await res.json(); setExports(Array.isArray(data) ? data : []); setLoading(false); }, [search]);
  useEffect(() => { loadData(); }, [loadData]);

  const loadClients = async () => { const res = await fetch('/api/clients'); setClients(Array.isArray(await res.json()) ? await (await fetch('/api/clients')).json() : []); };
  const loadBoxes = async (eid) => { const res = await fetch(`/api/boxes?export_id=${eid}`); const d = await res.json(); return Array.isArray(d) ? d : []; };

  const getBoxCode = (orderCode, idx) => `${orderCode || 'BOX'}/${idx + 1}`;

  const reindexBoxes = (bxs, orderCode) => bxs.map((b, i) => ({ ...b, box_code: getBoxCode(orderCode, i) }));

  const openAdd = () => {
    setEditing(null);
    setForm({ client: role === 'Origin Officer' ? 'CTL000 (Unknown)' : '', export_date: new Date().toISOString().split('T')[0], mawb_no: '', item: '', sender: '', sender_phone: '', recipient: '', recipient_phone: '', remark: '', bill_thb: '', bill_mnt: '', payment: 'No', box_type: '' });
    setBoxes([]); loadClients(); setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ client: row.client||'', export_date: row.export_date||'', mawb_no: row.mawb_no||'', item: row.item||'', sender: row.sender||'', sender_phone: row.sender_phone||'', recipient: row.recipient||'', recipient_phone: row.recipient_phone||'', remark: row.remark||'', bill_thb: row.bill_thb||'', bill_mnt: row.bill_mnt||'', payment: row.payment||'No', box_type: row.box_type||'' });
    loadClients(); loadBoxes(row.id).then(b => setBoxes(b)); setDetailOpen(false); setModalOpen(true);
  };

  const save = async () => {
    if (!form.client) { setToast({ msg: 'Select a client', type: 'error' }); return; }
    setSaving(true);
    const reindexed = reindexBoxes(boxes, editing?.order_code || 'NEW');
    const totalBoxs = reindexed.length;
    const totalGw = reindexed.reduce((s, b) => s + (parseFloat(b.gross_weight)||0), 0);
    const body = { ...form, total_boxs: totalBoxs, total_gw: totalGw };
    let exportId, orderCode;
    if (editing) {
      await fetch('/api/exports', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) });
      exportId = editing.id; orderCode = editing.order_code;
    } else {
      const res = await fetch('/api/exports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json(); exportId = d.id; orderCode = d.order_code;
    }
    const finalBoxes = reindexBoxes(reindexed, orderCode);
    for (const box of finalBoxes) {
      if (box.id && !box._new) {
        await fetch('/api/boxes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(box) });
      } else {
        const { _new, id, ...rest } = box;
        await fetch('/api/boxes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rest, export_id: exportId }) });
      }
    }
    setSaving(false); setToast({ msg: editing ? 'Updated' : 'Saved', type: 'success' }); setModalOpen(false); loadData();
  };

  const deleteExport = async () => { setSaving(true); await fetch(`/api/exports?id=${current.id}`, { method: 'DELETE' }); setSaving(false); setToast({ msg: 'Deleted', type: 'success' }); setConfirmOpen(false); setDetailOpen(false); loadData(); };

  const openDetail = async (row) => { setSaving(true); setCurrent(row); const b = await loadBoxes(row.id); setDetailBoxes(b); setSaving(false); setDetailOpen(true); };

  const openBoxFormFromDetail = () => {
    setEditing(current);
    setForm({ client: current.client||'', export_date: current.export_date||'', mawb_no: current.mawb_no||'', item: current.item||'', sender: current.sender||'', sender_phone: current.sender_phone||'', recipient: current.recipient||'', recipient_phone: current.recipient_phone||'', remark: current.remark||'', bill_thb: current.bill_thb||'', bill_mnt: current.bill_mnt||'', payment: current.payment||'No', box_type: current.box_type||'' });
    loadClients();
    setBoxes([...detailBoxes]);
    setDetailOpen(false);
    openBoxForm(null, current.order_code, detailBoxes.length);
    setModalOpen(true);
  };

  const togglePaymentFromDetail = async (val) => {
    setSaving(true);
    await fetch('/api/exports', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: current.id, payment: val }) });
    setCurrent({ ...current, payment: val });
    setSaving(false);
    setToast({ msg: `Payment: ${val}`, type: 'success' });
    loadData();
  };

  const openBoxForm = (box, orderCode, boxCount) => {
    const oc = orderCode || editing?.order_code || current?.order_code || 'BOX';
    const count = boxCount !== undefined ? boxCount : boxes.length;
    if (box) {
      setEditingBox(box);
      setBoxForm({ box_code: box.box_code||'', box_w: box.box_w||'', box_h: box.box_h||'', box_l: box.box_l||'', gross_weight: box.gross_weight||'', weight_result: box.weight_result||'' });
      setBoxItems(box.items || { item: '', unit: '', type: '' });
      setBoxPhotos(box.photos || {});
    } else {
      setEditingBox(null);
      setBoxForm({ box_code: getBoxCode(oc, count), box_w: '', box_h: '', box_l: '', gross_weight: '', weight_result: '' });
      setBoxItems({ item: '', unit: '', type: '' });
      setBoxPhotos({});
    }
    setBoxModalOpen(true);
  };

  const calcDim = () => { const w=parseFloat(boxForm.box_w)||0, h=parseFloat(boxForm.box_h)||0, l=parseFloat(boxForm.box_l)||0; return (w*h*l/6000).toFixed(2); };

  const handleMultiPhotoUpload = async (field, files) => {
    const urls = [];
    for (const file of files) { const fd = new FormData(); fd.append('file', file); const res = await fetch('/api/upload', { method: 'POST', body: fd }); const d = await res.json(); if (d.url) urls.push(d.url); }
    setBoxPhotos(prev => ({ ...prev, [field]: [...(Array.isArray(prev[field]) ? prev[field] : prev[field] ? [prev[field]] : []), ...urls] }));
  };

  const removePhoto = (field, idx) => { setBoxPhotos(prev => ({ ...prev, [field]: (Array.isArray(prev[field]) ? prev[field] : [prev[field]]).filter((_, i) => i !== idx) })); };

  const saveBox = () => {
    const dim = calcDim();
    const boxData = { ...boxForm, dimension: parseFloat(dim), items: boxItems, photos: boxPhotos };
    let newBoxes;
    if (editingBox) { newBoxes = boxes.map(b => (b === editingBox || b.id === editingBox.id) ? { ...editingBox, ...boxData } : b); }
    else { newBoxes = [...boxes, { ...boxData, _new: true, id: `temp_${Date.now()}` }]; }
    const oc = editing?.order_code || current?.order_code || 'BOX';
    setBoxes(reindexBoxes(newBoxes, oc));
    setBoxModalOpen(false);
  };

  const removeBox = (box) => {
    if (box.id && !box._new) fetch(`/api/boxes?id=${box.id}`, { method: 'DELETE' });
    const oc = editing?.order_code || current?.order_code || 'BOX';
    setBoxes(reindexBoxes(boxes.filter(b => b !== box), oc));
  };

  const calcEfTotal = (f) => { const ppk=parseFloat(f.price_per_kg)||0, wr=parseFloat(f.weight_result)||0, ppd=parseFloat(f.price_per_diff)||0, wd=parseFloat(f.weight_diff)||0; return (ppk*wr+ppd*wd).toFixed(2); };

  const openExportForm = async (exp) => {
    setSaving(true);
    const efRes = await fetch(`/api/export-forms?export_id=${exp.id}`); const efData = await efRes.json();
    const existing = Array.isArray(efData) && efData.length > 0 ? efData[0] : null;
    const wr = detailBoxes.reduce((s,b) => s+(parseFloat(b.weight_result)||0), 0);
    const base = { export_id: exp.id, export_date: exp.export_date||'', order_code: exp.order_code||'', client: exp.client||'', total_boxes: exp.total_boxs||0, total_gw: exp.total_gw||0 };
    if (existing) { setEfEditing(existing); setEfForm({ ...base, weight_result: existing.weight_result||wr, weight_diff: existing.weight_diff||'', price_per_kg: existing.price_per_kg||'', price_per_diff: existing.price_per_diff||'', total_thb: existing.total_thb||'', total_mnt: existing.total_mnt||'', type_box: existing.type_box||'Personal' }); }
    else { setEfEditing(null); setEfForm({ ...base, weight_result: wr, weight_diff: '', price_per_kg: '', price_per_diff: '', total_thb: '', total_mnt: '', type_box: 'Personal' }); }
    setSaving(false); setDetailOpen(false); setEfModalOpen(true);
  };

  const updateEfField = (key, val) => { const nf = { ...efForm, [key]: val }; if (['price_per_kg','weight_result','price_per_diff','weight_diff'].includes(key)) nf.total_thb = calcEfTotal(nf); setEfForm(nf); };

  const saveExportForm = async () => {
    setSaving(true); const body = { ...efForm, total_thb: calcEfTotal(efForm) };
    if (efEditing) { await fetch('/api/export-forms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: efEditing.id, ...body }) }); }
    else { await fetch('/api/export-forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    setSaving(false); setToast({ msg: 'Export Form saved', type: 'success' }); setEfModalOpen(false);
  };

  const filtered = exports.filter(r => (r.order_code||'').toLowerCase().includes(search.toLowerCase()) || (r.client||'').toLowerCase().includes(search.toLowerCase()) || (r.remark||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <LoadingOverlay show={saving || isPending} message={isPending ? "Loading..." : "Processing..."} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {lightboxUrl && <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="" /></div>}

      <div className="fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 rounded-full border flex items-center justify-center bg-white" style={{ borderColor: 'var(--border)' }}><span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span></button>
            Export
          </h2>
          {hasPermission(role, 'export_add') && <button onClick={openAdd} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'var(--black)' }}>+ Add Export</button>}
        </div>
        <div className="relative mb-5"><span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', fontSize: 20 }}>search</span><input type="text" placeholder="Search tracking, client..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputCls} pl-11`} style={{ ...inputStyle, background: 'var(--white)' }} /></div>

        {loading ? <div className="flex flex-col items-center py-16 gap-3" style={{ color: 'var(--text-muted)' }}><div className="spinner" /><span className="text-sm">Loading...</span></div>
        : filtered.length === 0 ? <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}><span className="material-icons-outlined block mb-3" style={{ fontSize: 48, color: 'var(--grey)' }}>inventory_2</span><p>No exports found</p></div>
        : <div className="overflow-x-auto rounded-xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
            <table className="w-full border-collapse rounded-xl overflow-hidden" style={{ background: 'white' }}>
              <thead><tr>{['Date','Order Code','Client','Boxs','GW.','Bill THB','Bill MNT','Payment','Box Type','Remark'].map(h => <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)', background: 'var(--cream)' }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(r => <tr key={r.id} onClick={() => openDetail(r)} className="cursor-pointer transition-all hover:bg-cream" style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{fmtD(r.export_date)}</td>
                <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--danger)' }}>{r.order_code}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.client||'-'}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.total_boxs||'-'}</td>
                <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>{r.total_gw||'-'}</td>
                <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--success)' }}>{r.bill_thb ? fmt(r.bill_thb) : '-'}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.bill_mnt ? fmt(r.bill_mnt) : '-'}</td>
                <td className="px-4 py-3.5 text-sm">{r.payment === 'Yes' ? <span style={{ color: 'var(--success)' }}>✓ Paid</span> : <span style={{ color: 'var(--danger)' }}>✕ Unpaid</span>}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.box_type||'-'}</td>
                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{r.remark||'-'}</td>
              </tr>)}</tbody>
            </table>
          </div>}
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Export Detail" footer={
        hasPermission(role, 'export_add') && current && <>
          <button onClick={() => openExportForm(current)} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ background: 'var(--success)', color: 'white' }}><span className="material-icons-outlined" style={{ fontSize: 16 }}>receipt_long</span>Export Form</button>
          <button onClick={() => printExportPDF(current, detailBoxes)} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ border: '1.5px solid var(--info)', color: 'var(--info)' }}><span className="material-icons-outlined" style={{ fontSize: 16 }}>print</span>Print</button>
          <button onClick={() => openEdit(current)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Edit</button>
          <button onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--danger)' }}>Delete</button>
        </>
      }>
        {current && <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[['Order Code',current.order_code,'var(--danger)'],['Client',current.client],['Date',fmtD(current.export_date)],['MAWB No',current.mawb_no],['Item',current.item],['Sender',current.sender],['Sender Phone',current.sender_phone],['Recipient',current.recipient],['Recipient Phone',current.recipient_phone],['Total Boxs',current.total_boxs],['Total GW',current.total_gw],['Bill THB',current.bill_thb ? fmt(current.bill_thb) : '-'],['Bill MNT',current.bill_mnt ? fmt(current.bill_mnt) : '-'],['Box Type',current.box_type]].map(([l,v,c]) => <div key={l} className="mb-1"><div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</div><div className="text-sm font-medium" style={c ? { color: c, fontWeight: 600 } : {}}>{v||'-'}</div></div>)}
          </div>
          <div className="mb-3 mt-3">
            <div className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Payment</div>
            <div className="payment-toggle" style={{ maxWidth: 200 }}>
              <button className={current.payment === 'Yes' ? 'active-yes' : ''} onClick={() => togglePaymentFromDetail('Yes')}>✓ Paid</button>
              <button className={current.payment !== 'Yes' ? 'active-no' : ''} onClick={() => togglePaymentFromDetail('No')}>✕ Unpaid</button>
            </div>
          </div>
          <div className="mt-2"><div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Remark</div><div className="text-sm">{current.remark||'-'}</div></div>
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold" style={{ color: 'var(--danger)' }}>Boxes ({detailBoxes.length})</div>
              {hasPermission(role, 'export_add') && <button onClick={openBoxFormFromDetail} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1" style={{ background: 'var(--latte)' }}><span className="material-icons-outlined" style={{ fontSize: 14 }}>add_box</span>Add Box</button>}
            </div>
            {detailBoxes.length === 0 && <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}><span className="material-icons-outlined block mb-1" style={{ fontSize: 32, color: 'var(--grey)' }}>inbox</span><span className="text-xs">No boxes yet</span></div>}
            {detailBoxes.map(b => <div key={b.id} onClick={() => { setCurrentBox(b); setBoxDetailOpen(true); }} className="p-3 rounded-lg mb-2 cursor-pointer transition-all hover:shadow-sm" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center"><span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>{b.box_code||'No code'}</span><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Dim: {b.dimension} | GW: {b.gross_weight}kg</span></div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{b.items?.item||'-'} | WR: {b.weight_result}kg</div>
            </div>)}
          </div>
        </div>}
      </Modal>

      <Modal isOpen={boxDetailOpen} onClose={() => setBoxDetailOpen(false)} title="Box Detail">
        {currentBox && <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[['Box Code',currentBox.box_code,'var(--danger)'],['Size',`${currentBox.box_w}×${currentBox.box_h}×${currentBox.box_l} cm`],['Dimension',currentBox.dimension],['Gross Weight',`${currentBox.gross_weight} kg`],['Weight Result',`${currentBox.weight_result} kg`]].map(([l,v,c]) => <div key={l} className="mb-1"><div className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</div><div className="text-sm font-medium" style={c ? { color: c, fontWeight: 600 } : {}}>{v||'-'}</div></div>)}
          </div>
          {currentBox.items && currentBox.items.item && <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}><div className="text-sm font-bold mb-2">Item</div><div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{currentBox.items.item} — {currentBox.items.unit} unit(s) — {currentBox.items.type}</div></div>}
          {Object.keys(currentBox.photos||{}).some(k => { const v = currentBox.photos[k]; return Array.isArray(v) ? v.length > 0 : !!v; }) && <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-sm font-bold mb-2">Photos</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(currentBox.photos).map(([k, v]) => {
                const urls = Array.isArray(v) ? v : v ? [v] : [];
                return urls.map((url, i) => <div key={`${k}-${i}`} className="cursor-pointer" onClick={() => setLightboxUrl(url)}>
                  <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{PHOTO_LABELS[k]}</div>
                  <img src={url} className="w-full h-20 object-cover rounded-lg transition-all hover:opacity-80 hover:shadow-md" alt="" />
                </div>);
              })}
            </div>
          </div>}
        </div>}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Export' : 'Add Export'} footer={<>
        <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
        <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--latte)' }}>Save</button>
      </>}>
        {editing && <F label="Order Code"><input value={editing.order_code} readOnly className={inputCls} style={roStyle} /></F>}
        <F label="Client *">{role === 'Origin Officer' ? <input value="CTL000 (Unknown)" readOnly className={inputCls} style={roStyle} /> : <select value={form.client} onChange={(e) => setForm({...form, client: e.target.value})} className={inputCls} style={inputStyle}><option value="">-- เลือกลูกค้า --</option>{clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>}</F>
        <F label="Export Date"><DatePicker value={form.export_date} onChange={(v) => setForm({...form, export_date: v})} /></F>
        <F label="MAWB No"><input value={form.mawb_no} onChange={(e) => setForm({...form, mawb_no: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Item"><input value={form.item} onChange={(e) => setForm({...form, item: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Sender"><input value={form.sender} onChange={(e) => setForm({...form, sender: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Sender Phone"><input value={form.sender_phone} onChange={(e) => setForm({...form, sender_phone: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Recipient"><input value={form.recipient} onChange={(e) => setForm({...form, recipient: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Recipient Phone"><input value={form.recipient_phone} onChange={(e) => setForm({...form, recipient_phone: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Bill THB"><input type="number" step="0.01" value={form.bill_thb} onChange={(e) => setForm({...form, bill_thb: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Bill MNT"><input type="number" step="0.01" value={form.bill_mnt} onChange={(e) => setForm({...form, bill_mnt: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Payment">
          <div className="payment-toggle">
            <button className={form.payment === 'Yes' ? 'active-yes' : ''} onClick={() => setForm({...form, payment: 'Yes'})}>✓ Paid</button>
            <button className={form.payment !== 'Yes' ? 'active-no' : ''} onClick={() => setForm({...form, payment: 'No'})}>✕ Unpaid</button>
          </div>
        </F>
        <F label="Box Type"><select value={form.box_type} onChange={(e) => setForm({...form, box_type: e.target.value})} className={inputCls} style={inputStyle}><option value="">-- Select --</option>{BOX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></F>
        <F label="Remark"><textarea value={form.remark} onChange={(e) => setForm({...form, remark: e.target.value})} className={inputCls} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} /></F>
        <div className="mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold" style={{ color: 'var(--danger)' }}>Boxes ({boxes.length})</span><button onClick={() => openBoxForm(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--latte)' }}>+ Add Box</button></div>
          {boxes.map((b, i) => <div key={b.id||i} className="p-3 rounded-lg mb-2 flex justify-between items-center" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
            <div><span className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>{b.box_code||`Box ${i+1}`}</span><span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Dim: {b.dimension} | GW: {b.gross_weight}kg</span></div>
            <div className="flex gap-2"><button onClick={() => openBoxForm(b)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--info)', color: 'white' }}>Edit</button><button onClick={() => removeBox(b)} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--danger)', color: 'white' }}>×</button></div>
          </div>)}
        </div>
      </Modal>

      <Modal isOpen={boxModalOpen} onClose={() => setBoxModalOpen(false)} title={editingBox ? 'Edit Box' : 'Add Box'} footer={<><button onClick={() => setBoxModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button><button onClick={saveBox} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--latte)' }}>Save Box</button></>}>
        <F label="Box Code"><input value={boxForm.box_code} readOnly className={inputCls} style={roStyle} /></F>
        <div className="text-sm font-bold mt-4 mb-3 pt-3" style={{ color: 'var(--danger)', borderTop: '1px solid var(--border)' }}>All Item</div>
        <div className="p-3 rounded-lg mb-2" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
          <div className="flex gap-2 mb-2"><input placeholder="Item name" value={boxItems.item||''} onChange={(e) => setBoxItems({...boxItems, item: e.target.value})} className={`${inputCls} flex-1`} style={inputStyle} /><input placeholder="Unit" type="number" value={boxItems.unit||''} onChange={(e) => setBoxItems({...boxItems, unit: e.target.value})} className={inputCls} style={{ ...inputStyle, width: 70 }} /></div>
          <select value={boxItems.type||''} onChange={(e) => setBoxItems({...boxItems, type: e.target.value})} className={inputCls} style={inputStyle}><option value="">Select type</option>{ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
        </div>
        <div className="text-sm font-bold mt-4 mb-3 pt-3" style={{ color: 'var(--danger)', borderTop: '1px solid var(--border)' }}>Box Size (cm.)</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div><label className="text-xs" style={{ color: 'var(--text-muted)' }}>W</label><input type="number" value={boxForm.box_w} onChange={(e) => setBoxForm({...boxForm, box_w: e.target.value})} className={inputCls} style={inputStyle} /></div>
          <div><label className="text-xs" style={{ color: 'var(--text-muted)' }}>H</label><input type="number" value={boxForm.box_h} onChange={(e) => setBoxForm({...boxForm, box_h: e.target.value})} className={inputCls} style={inputStyle} /></div>
          <div><label className="text-xs" style={{ color: 'var(--text-muted)' }}>L</label><input type="number" value={boxForm.box_l} onChange={(e) => setBoxForm({...boxForm, box_l: e.target.value})} className={inputCls} style={inputStyle} /></div>
        </div>
        <F label="Dimension (auto)"><input value={calcDim()} readOnly className={inputCls} style={roStyle} /></F>
        <F label="Gross Weight (kg.)"><input type="number" step="0.01" value={boxForm.gross_weight} onChange={(e) => setBoxForm({...boxForm, gross_weight: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Weight Result (kg.)"><input type="number" step="0.01" value={boxForm.weight_result} onChange={(e) => setBoxForm({...boxForm, weight_result: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <div className="text-sm font-bold mt-4 mb-3 pt-3" style={{ color: 'var(--danger)', borderTop: '1px solid var(--border)' }}>Internal Photos</div>
        {Object.keys(PHOTO_LABELS).map(field => {
          const photos = Array.isArray(boxPhotos[field]) ? boxPhotos[field] : boxPhotos[field] ? [boxPhotos[field]] : [];
          return <div key={field} className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>{PHOTO_LABELS[field]}</label>
            <div className="flex flex-wrap gap-2">
              {photos.map((url, i) => <div key={i} className="relative"><img src={url} className="h-16 w-16 object-cover rounded-lg" alt="" /><button onClick={() => removePhoto(field, i)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ background: 'var(--danger)' }}>×</button></div>)}
              <div onClick={() => document.getElementById(`bp-${field}`).click()} className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer" style={{ borderColor: 'var(--border)', color: 'var(--grey)' }}><span className="material-icons-outlined" style={{ fontSize: 20 }}>add_photo_alternate</span></div>
            </div>
            <input id={`bp-${field}`} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files.length && handleMultiPhotoUpload(field, Array.from(e.target.files))} />
          </div>;
        })}
      </Modal>

      <Modal isOpen={efModalOpen} onClose={() => setEfModalOpen(false)} title={efEditing ? 'Edit Export Form' : 'New Export Form'} footer={<><button onClick={() => { setEfModalOpen(false); if(current) setDetailOpen(true); }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button><button onClick={saveExportForm} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--latte)' }}>Save</button></>}>
        <div className="text-xs font-bold uppercase tracking-wider mb-3 pb-2" style={{ color: 'var(--danger)', borderBottom: '1px solid var(--border)' }}>From Export (Read-only)</div>
        <div className="grid grid-cols-2 gap-3 mb-2"><F label="Export Date"><input value={fmtD(efForm.export_date)} readOnly className={inputCls} style={roStyle} /></F><F label="Order Code"><input value={efForm.order_code||''} readOnly className={inputCls} style={roStyle} /></F></div>
        <F label="Client"><input value={efForm.client||''} readOnly className={inputCls} style={roStyle} /></F>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><F label="Total Boxes"><input value={efForm.total_boxes||0} readOnly className={inputCls} style={roStyle} /></F><F label="Total GW"><input value={efForm.total_gw||0} readOnly className={inputCls} style={roStyle} /></F><F label="Weight Result"><input value={efForm.weight_result||0} readOnly className={inputCls} style={roStyle} /></F></div>
        <div className="text-xs font-bold uppercase tracking-wider mt-4 mb-3 pb-2" style={{ color: 'var(--success)', borderBottom: '1px solid var(--border)' }}>Pricing</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><F label="Weight Difference"><input type="number" step="0.01" value={efForm.weight_diff} onChange={(e) => updateEfField('weight_diff', e.target.value)} className={inputCls} style={inputStyle} /></F><F label="Price per kg"><input type="number" step="0.01" value={efForm.price_per_kg} onChange={(e) => updateEfField('price_per_kg', e.target.value)} className={inputCls} style={inputStyle} /></F></div>
        <F label="Price per diff"><input type="number" step="0.01" value={efForm.price_per_diff} onChange={(e) => updateEfField('price_per_diff', e.target.value)} className={inputCls} style={inputStyle} /></F>
        <F label="Total THB (auto)"><input value={calcEfTotal(efForm)} readOnly className={inputCls} style={roStyle} /></F>
        <F label="Total MNT"><input type="number" step="0.01" value={efForm.total_mnt} onChange={(e) => setEfForm({...efForm, total_mnt: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Type Box"><select value={efForm.type_box} onChange={(e) => setEfForm({...efForm, type_box: e.target.value})} className={inputCls} style={inputStyle}>{['Personal','Special1','Special2','Special3'].map(t => <option key={t} value={t}>{t}</option>)}</select></F>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} title="Delete Export" message={`Delete ${current?.order_code}?`} onConfirm={deleteExport} onCancel={() => setConfirmOpen(false)} />
    </AppShell>
  );
}
