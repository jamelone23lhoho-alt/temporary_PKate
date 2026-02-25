'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { hasPermission } from '@/lib/permissions';
import { printNotePDF } from '@/components/PrintPDF';

export default function NotePage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/notes?search=${search}`);
    const data = await res.json();
    setNotes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().split('T')[0], topic: '', type: '', description: '' });
    setImages([]);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ date: row.date || '', topic: row.topic || '', type: row.type || '', description: row.description || '' });
    setImages(row.images || []);
    setDetailOpen(false);
    setModalOpen(true);
  };

  const addImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setImages(prev => [...prev, data.url]);
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!form.topic || !form.type) { setToast({ msg: 'Please fill Topic and Type', type: 'error' }); return; }
    const body = { ...form, images };
    if (editing) {
      await fetch('/api/notes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...body }) });
      setToast({ msg: 'Note updated', type: 'success' });
    } else {
      await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setToast({ msg: 'Note saved', type: 'success' });
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await fetch(`/api/notes?id=${current.id}`, { method: 'DELETE' });
    setToast({ msg: 'Note deleted', type: 'success' });
    setConfirmOpen(false);
    setDetailOpen(false);
    loadData();
  };

  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt) ? d : `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  };

  const truncate = (str, len) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { border: '1.5px solid var(--border)' };

  return (
    <AppShell>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="w-9 h-9 rounded-full border flex items-center justify-center bg-white" style={{ borderColor: 'var(--border)' }}>
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            Note
          </h2>
          {hasPermission(role, 'note_add') && (
            <button onClick={openAdd} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--black)' }}>+ Add Note</button>
          )}
        </div>

        <div className="relative mb-5">
          <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', fontSize: 20 }}>search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topic or description..." className={`${inputCls} pl-11`} style={{ ...inputStyle, background: 'var(--white)' }} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16" style={{ color: 'var(--text-muted)' }}><div className="spinner" /><div className="mt-3 text-sm">Loading data...</div></div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <span className="material-icons-outlined block mb-3" style={{ fontSize: 48, color: 'var(--grey)' }}>note_alt</span>
            <p className="text-sm">No notes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => { setCurrent(note); setDetailOpen(true); }}
                className="bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="text-[11px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>{fmtDate(note.date)}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{truncate(note.topic, 25)}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{truncate(note.description, 20)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Note Detail" footer={
        hasPermission(role, 'note_add') && current && <>
          <button onClick={() => printNotePDF(current)} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ border: '1.5px solid var(--info)', color: 'var(--info)' }}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>print</span>Print
          </button>
          <button onClick={() => openEdit(current)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Edit</button>
          <button onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--danger)' }}>Delete</button>
        </>
      }>
        {current && (
          <>
            <div className="mb-3"><div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Date</div><div className="text-sm font-medium">{fmtDate(current.date)}</div></div>
            <div className="mb-3"><div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Topic</div><div className="text-sm font-medium">{current.topic}</div></div>
            <div className="mb-3"><div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Type</div><div className="text-sm font-medium">{current.type}</div></div>
            <div className="mb-3">
              <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Description</div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{current.description || '-'}</div>
            </div>
            {current.images && current.images.length > 0 && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Images</div>
                <div className="flex flex-wrap gap-2">
                  {current.images.map((url, i) => (
                    <div key={i} className="w-24 h-24 rounded-lg overflow-hidden"><img src={url} className="w-full h-full object-cover" alt="" /></div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Note' : 'Add Note'} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} disabled={uploading} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: uploading ? 'var(--grey)' : 'var(--black)' }}>
            {uploading ? 'Uploading...' : 'Save'}
          </button>
        </>
      }>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Date <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className={inputCls} style={inputStyle} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Topic <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} className={inputCls} style={inputStyle} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Type <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className={inputCls} style={inputStyle}>
            <option value="">Select...</option>
            <option value="Company Information">Company Information</option>
            <option value="Combination box">Combination box</option>
            <option value="Summary Export">Summary Export</option>
            <option value="Others">Others</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={5} placeholder="กรอกรายละเอียด..." className={inputCls} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Images</label>
          <div onClick={() => document.getElementById('note-img-input').click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:border-latte" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <span className="material-icons-outlined block mb-1" style={{ fontSize: 32, color: 'var(--grey)' }}>add_photo_alternate</span>
            <span className="text-sm">+ Add Image</span>
          </div>
          <input id="note-img-input" type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={url} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ background: 'var(--danger)' }}>×</button>
                </div>
              ))}
            </div>
          )}
          {uploading && <p className="text-sm mt-2" style={{ color: 'var(--latte)' }}>Uploading...</p>}
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} title="Delete Note" message="Delete this note?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
