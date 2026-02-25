'use client';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import LoadingOverlay from '@/components/LoadingOverlay';
import { hasPermission } from '@/lib/permissions';
import { printClientPDF } from '@/components/PrintPDF';

function F({ label, req, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {label}{req && <span style={{ color: 'var(--danger)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

export default function ClientPage() {
  const [clients, setClients] = useState([]);
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
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const goBack = () => { startTransition(() => { router.push('/dashboard'); }); };

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients?search=${search}`);
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const emptyForm = () => ({
    supporter:'', remark:'', id_card_image:'', profile_image:'',
    sender_address:'', sender_phone:'', sender_image:'',
    recipient_address:'', recipient_phone:'', recipient_image:'',
  });

  const openAdd = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name||'', nationality: row.nationality||'', gender: row.gender||'',
      supporter: row.supporter||'', remark: row.remark||'',
      id_card_image: row.id_card_image||'', profile_image: row.profile_image||'',
      sender_address: row.sender_address||'', sender_phone: row.sender_phone||'',
      sender_image: row.sender_image||'',
      recipient_address: row.recipient_address||'', recipient_phone: row.recipient_phone||'',
      recipient_image: row.recipient_image||'',
    });
    setDetailOpen(false);
    setModalOpen(true);
  };

  const uploadImage = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url || '';
  };

  const handleImageChange = async (e, field) => {
    if (!e.target.files[0]) return;
    setUploading(true);
    const url = await uploadImage(e.target.files[0]);
    setForm(prev => ({ ...prev, [field]: url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name) { setToast({ msg: 'Please enter client name', type: 'error' }); return; }
    if (editing) {
      await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
      setToast({ msg: 'Client updated', type: 'success' });
    } else {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setToast({ msg: 'Client saved', type: 'success' });
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await fetch(`/api/clients?id=${current.id}`, { method: 'DELETE' });
    setToast({ msg: 'Client deleted', type: 'success' });
    setConfirmOpen(false);
    setDetailOpen(false);
    loadData();
  };



  const SectionTitle = ({ children }) => (
    <div className="text-sm font-bold mt-5 mb-3 pt-4 border-t" style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}>{children}</div>
  );

  const ImageUpload = ({ field, label }) => (
    <F label={label}>
      {form[field] ? (
        <div className="relative inline-block">
          <img src={form[field]} className="max-w-full max-h-28 rounded-lg" alt="" />
          <button onClick={() => setForm(prev => ({...prev, [field]: ''}))} className="absolute top-1 right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ background: 'var(--danger)' }}>×</button>
        </div>
      ) : (
        <div onClick={() => document.getElementById(`file-${field}`).click()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:border-latte hover:bg-cream" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <span className="material-icons-outlined block mb-1" style={{ fontSize: 32, color: 'var(--grey)' }}>add_photo_alternate</span>
          <span className="text-sm">Click to select {label}</span>
        </div>
      )}
      <input id={`file-${field}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, field)} />
    </F>
  );

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all";
  const inputStyle = { border: '1.5px solid var(--border)' };

  return (
    <AppShell>
      <LoadingOverlay show={isPending} message="Loading..." />
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <button onClick={goBack} className="w-9 h-9 rounded-full border flex items-center justify-center bg-white" style={{ borderColor: 'var(--border)' }}>
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            Client
          </h2>
          {hasPermission(role, 'client_add') && (
            <button onClick={openAdd} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--black)' }}>+ Add Client</button>
          )}
        </div>

        <div className="relative mb-5">
          <span className="material-icons-outlined absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)', fontSize: 20 }}>search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, code, or phone..." className={`${inputCls} pl-11`} style={{ ...inputStyle, background: 'var(--white)' }} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16" style={{ color: 'var(--text-muted)' }}><div className="spinner" /><div className="mt-3 text-sm">Loading data...</div></div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
            <span className="material-icons-outlined block mb-3" style={{ fontSize: 48, color: 'var(--grey)' }}>people_outline</span>
            <p className="text-sm">No client records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
              <thead>
                <tr style={{ background: 'var(--cream)' }}>
                  {['Code','Name','Nationality','Gender','Supporter'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(row => (
                  <tr key={row.id} onClick={() => { setCurrent(row); setDetailOpen(true); }} className="cursor-pointer transition-all hover:bg-cream" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: 'var(--danger)' }}>{row.client_code}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.name}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.nationality || '-'}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.gender || '-'}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.supporter || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Client Detail" footer={
        hasPermission(role, 'client_add') && current && <>
          <button onClick={() => printClientPDF(current)} className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5" style={{ border: '1.5px solid var(--info)', color: 'var(--info)' }}>
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>print</span>Print
          </button>
          <button onClick={() => openEdit(current)} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Edit</button>
          <button onClick={() => setConfirmOpen(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--danger)' }}>Delete</button>
        </>
      }>
        {current && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Client Code', current.client_code, true], ['Name', current.name],
                ['Nationality', current.nationality], ['Gender', current.gender],
                ['Supporter', current.supporter],
              ].map(([l,v,c]) => (
                <div key={l}>
                  <div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</div>
                  <div className="text-sm font-medium" style={{ color: c ? 'var(--danger)' : 'var(--text-primary)' }}>{v||'-'}</div>
                </div>
              ))}
            </div>
            {current.remark && <div className="mt-3"><div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>Remark</div><div className="text-sm">{current.remark}</div></div>}
            {[current.id_card_image, current.profile_image, current.sender_image, current.recipient_image].some(Boolean) && (
              <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                {[['ID Card', current.id_card_image],['Profile', current.profile_image],['Sender', current.sender_image],['Recipient', current.recipient_image]].map(([l,url]) => url && (
                  <div key={l} className="mb-2"><span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{l}</span><br/><img src={url} className="max-w-full max-h-36 rounded-lg mt-1" alt="" /></div>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[['Sender Address', current.sender_address],['Sender Phone', current.sender_phone],['Recipient Address', current.recipient_address],['Recipient Phone', current.recipient_phone]].map(([l,v]) => (
                <div key={l}><div className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{l}</div><div className="text-sm">{v||'-'}</div></div>
              ))}
            </div>
          </>
        )}
      </Modal>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Client' : 'เพิ่มลูกค้าใหม่ (Clients Form)'} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} disabled={uploading} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: uploading ? 'var(--grey)' : 'var(--black)' }}>
            {uploading ? 'Uploading...' : 'Save'}
          </button>
        </>
      }>
        <F label="Name" req><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Nationality"><input value={form.nationality} onChange={(e) => setForm({...form, nationality: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Gender">
          <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})} className={inputCls} style={inputStyle}>
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </F>
        <F label="Supporter"><input value={form.supporter} onChange={(e) => setForm({...form, supporter: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <F label="Remark"><textarea value={form.remark} onChange={(e) => setForm({...form, remark: e.target.value})} className={inputCls} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} /></F>

        <SectionTitle>Images & Identity</SectionTitle>
        <ImageUpload field="id_card_image" label="ID Card/Passport Image" />
        <ImageUpload field="profile_image" label="Profile Image" />

        <SectionTitle>Sender Information</SectionTitle>
        <F label="Sender Address"><textarea value={form.sender_address} onChange={(e) => setForm({...form, sender_address: e.target.value})} className={inputCls} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} /></F>
        <F label="Sender Phone"><input value={form.sender_phone} onChange={(e) => setForm({...form, sender_phone: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <ImageUpload field="sender_image" label="Sender Image" />

        <SectionTitle>Recipient Information</SectionTitle>
        <F label="Recipient Address"><textarea value={form.recipient_address} onChange={(e) => setForm({...form, recipient_address: e.target.value})} className={inputCls} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} /></F>
        <F label="Recipient Phone"><input value={form.recipient_phone} onChange={(e) => setForm({...form, recipient_phone: e.target.value})} className={inputCls} style={inputStyle} /></F>
        <ImageUpload field="recipient_image" label="Recipient Image" />
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} title="Delete Client" message={`Delete ${current?.name}?`} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
