'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { hasPermission } from '@/lib/permissions';

const ROLES = ['Software Developer','CEO Mongolia','CEO Thailand','Customer Service Officer','Origin Officer','Admin','Staff'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({});
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('tolun_user');
    if (stored) setRole(JSON.parse(stored).role);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ username: '', password: '', role: '', status: 'Active' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setCurrent(row);
    setForm({ username: row.username, password: '', role: row.role, status: row.status });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.username || !form.role) { setToast({ msg: 'Fill Username and Role', type: 'error' }); return; }
    if (editing) {
      const body = { id: editing.id, username: form.username, role: form.role, status: form.status };
      if (form.password) body.password = form.password;
      await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setToast({ msg: 'User updated', type: 'success' });
    } else {
      if (!form.password) { setToast({ msg: 'Password required', type: 'error' }); return; }
      await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setToast({ msg: 'User saved', type: 'success' });
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await fetch(`/api/users?id=${current.id}`, { method: 'DELETE' });
    setToast({ msg: 'User deleted', type: 'success' });
    setConfirmOpen(false);
    loadData();
  };

  const ic = "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all";
  const is = { border: '1.5px solid var(--border)' };

  return (
    <AppShell>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="w-9 h-9 rounded-full border flex items-center justify-center bg-white" style={{ borderColor: 'var(--border)' }}>
              <span className="material-icons-outlined" style={{ fontSize: 20 }}>arrow_back</span>
            </button>
            Users
          </h2>
          {hasPermission(role, 'users_add') && (
            <button onClick={openAdd} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--latte)' }}>+ Add User</button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16" style={{ color: 'var(--text-muted)' }}>
            <div className="spinner" />
            <div className="mt-3 text-sm">Loading data...</div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm">
            <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
              <thead>
                <tr style={{ background: 'var(--cream)' }}>
                  {['ID','User_ID','Username','Role','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-muted)', borderBottom: '2px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(row => (
                  <tr key={row.id} className="transition-all hover:bg-cream" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.id?.substring(0,8)}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.user_id}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.username}</td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{row.role}</td>
                    <td className="px-4 py-3.5 text-sm">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{
                        background: row.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                        color: row.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                      }}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(row)} className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Edit</button>
                        <button onClick={() => { setCurrent(row); setConfirmOpen(true); }} className="px-3 py-1.5 rounded-md text-xs font-semibold text-white" style={{ background: 'var(--danger)' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Add User'} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'var(--black)' }}>Save</button>
        </>
      }>
        {editing && (
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1.5">User ID</label>
            <input value={editing.user_id} readOnly className={ic} style={{ ...is, background: 'var(--cream)', color: 'var(--text-muted)' }} />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Username (Email) <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className={ic} style={is} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
          <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className={ic} style={is} placeholder={editing ? 'Leave blank to keep current' : ''} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Role <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className={ic} style={is}>
            <option value="">Select role...</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className={ic} style={is}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} title="Delete User" message={`Delete user ${current?.username}?`} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </AppShell>
  );
}
